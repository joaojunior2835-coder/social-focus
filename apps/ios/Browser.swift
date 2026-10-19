import SwiftUI
import WebKit
import JavaScriptCore

@main struct SocialFocusApp: App {
    var body: some Scene { WindowGroup { BrowserScreen() } }
}

final class BrowserModel: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    @Published var blocked = false
    @Published var error = ""
    @Published var external: URL?
    @Published var platform = "instagram"
    let web: WKWebView
    private let engine: JSContext
    private var lastAllowed: URL?
    var filters: [String: Bool] {
        Dictionary(uniqueKeysWithValues: ["feeds", "reels", "stories", "explore"].map {
            ($0, UserDefaults.standard.object(forKey: $0) as? Bool ?? true)
        })
    }
    static func resource(_ name: String, _ ext: String) -> String {
        guard let url = Bundle.main.url(forResource: name, withExtension: ext),
              let source = try? String(contentsOf: url, encoding: .utf8) else {
            fatalError("Required bundled filter resource missing")
        }
        return source
    }
    override init() {
        engine = JSContext()!
        engine.evaluateScript(Self.resource("core", "js"))
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = .all
        let controller = WKUserContentController()
        config.userContentController = controller
        web = WKWebView(frame: .zero, configuration: config)
        super.init()
        web.navigationDelegate = self
        web.uiDelegate = self
        installScripts()
        open("https://www.instagram.com/direct/inbox/")
    }
    func installScripts() {
        let c = web.configuration.userContentController
        c.removeAllUserScripts()
        let data = try! JSONSerialization.data(withJSONObject: filters, options: [.sortedKeys])
        let json = String(data: data, encoding: .utf8)!
        let css = Self.resource("start", "css")
        let cssJSON = String(data: try! JSONSerialization.data(withJSONObject: [css]), encoding: .utf8)!
        let source = "window.__SF_SETTINGS__ = \(json);" + Self.resource("navigation", "js") +
            "const sfStyle=document.createElement('style');sfStyle.textContent=\(cssJSON)[0];(document.head||document.documentElement)?.append(sfStyle);" +
            Self.resource("content", "js")
        c.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false))
        web.evaluateJavaScript("window.__socialFocus?.update(\(json))", completionHandler: nil)
    }
    func decision(_ url: URL) -> [String: Any] {
        guard url.scheme?.lowercased() == "https", url.user == nil, url.password == nil,
              let host = url.host else { return ["blocked": true, "platform": "external"] }
        let result = engine.objectForKeyedSubscript("SocialFocusCore")?.invokeMethod("decide", withArguments: [host, url.path.isEmpty ? "/" : url.path, url.query ?? "", filters])
        return result?.toDictionary() as? [String: Any] ?? ["blocked": true, "platform": "external"]
    }
    func open(_ text: String) {
        guard let url = URL(string: text) else { return }
        let d = decision(url)
        if d["platform"] as? String == "external" { external = url; return }
        if d["blocked"] as? Bool != false { blocked = true; return }
        blocked = false; error = ""
        web.load(URLRequest(url: url))
    }
    func inbox() { open(platform == "instagram" ? "https://www.instagram.com/direct/inbox/" : "https://www.tiktok.com/messages") }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        let d = decision(url)
        if d["platform"] as? String == "external" {
            // Never silently invoke a native app or an unfiltered browser.
            if navigationAction.targetFrame?.isMainFrame != false { external = url }
            decisionHandler(.cancel); return
        }
        if d["blocked"] as? Bool != false {
            if navigationAction.targetFrame?.isMainFrame != false { blocked = true }
            decisionHandler(.cancel); return
        }
        if navigationAction.targetFrame == nil {
            decisionHandler(.cancel); open(url.absoluteString); return
        }
        if navigationAction.targetFrame?.isMainFrame == true { blocked = false; error = ""; lastAllowed = url }
        decisionHandler(.allow)
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { open(url.absoluteString) }
        return nil
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError e: Error) {
        if (e as NSError).code != NSURLErrorCancelled { error = "Page could not load. Check your connection and retry." }
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError e: Error) { error = "Page interrupted. Retry when connected." }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { error = "Browser restarted. Tap Reload to recover." }
    func reload() { error = ""; if web.url != nil { web.reload() } else if let url = lastAllowed { open(url.absoluteString) } else { inbox() } }
}

struct WebSurface: UIViewRepresentable {
    let web: WKWebView
    func makeUIView(context: Context) -> WKWebView { web }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct BrowserScreen: View {
    @StateObject private var model = BrowserModel()
    @State private var showSettings = false
    @State private var handle = ""
    @Environment(\.openURL) private var openURL
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack {
                    Picker("Platform", selection: $model.platform) {
                        Text("Instagram").tag("instagram"); Text("TikTok").tag("tiktok")
                    }.pickerStyle(.segmented).onChange(of: model.platform) { _ in model.inbox() }
                    Button { showSettings = true } label: { Image(systemName: "slider.horizontal.3") }.accessibilityLabel("Settings")
                }.padding()
                HStack {
                    TextField("Account handle", text: $handle).textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button("Profile") {
                        guard handle.range(of: "^[A-Za-z0-9._]{1,30}$", options: .regularExpression) != nil else { return }
                        model.open(model.platform == "instagram" ? "https://www.instagram.com/\(handle)/" : "https://www.tiktok.com/@\(handle)")
                    }
                }.padding(.horizontal).padding(.bottom, 8)
                ZStack {
                    WebSurface(web: model.web)
                    if model.blocked {
                        Color(uiColor: .systemBackground)
                        VStack(spacing: 18) {
                            Image(systemName: "hand.raised.fill").font(.largeTitle)
                            Text("Keep your intention.").font(.title2.bold())
                            Text("This consumption destination is blocked.").multilineTextAlignment(.center)
                            Button("Open messages") { model.inbox() }.buttonStyle(.borderedProminent)
                        }.padding(30)
                    }
                    if !model.error.isEmpty {
                        VStack { Text(model.error); Button("Retry") { model.reload() } }.padding().background(.regularMaterial)
                    }
                }
                HStack {
                    Button { model.web.goBack() } label: { Image(systemName: "chevron.left") }.accessibilityLabel("Back")
                    Button { model.web.goForward() } label: { Image(systemName: "chevron.right") }.accessibilityLabel("Forward")
                    Spacer()
                    Button("Messages") { model.inbox() }
                    Button("Create") { model.open(model.platform == "instagram" ? "https://www.instagram.com/create/select/" : "https://www.tiktok.com/upload") }
                    Button { model.reload() } label: { Image(systemName: "arrow.clockwise") }.accessibilityLabel("Reload")
                }.padding()
            }.navigationTitle("Social Focus").navigationBarTitleDisplayMode(.inline)
                .sheet(isPresented: $showSettings) { FilterSettings(model: model) }
                .alert("Open outside protection?", isPresented: Binding(get: { model.external != nil }, set: { if !$0 { model.external = nil } })) {
                    Button("Cancel", role: .cancel) { model.external = nil }
                    Button("Open unfiltered") { if let url = model.external { openURL(url) }; model.external = nil }
                } message: { Text("The destination or native app is unfiltered. Continue only deliberately.") }
        }
    }
}

struct FilterSettings: View {
    @ObservedObject var model: BrowserModel
    @Environment(\.dismiss) var dismiss
    @AppStorage("feeds") var feeds = true
    @AppStorage("reels") var reels = true
    @AppStorage("stories") var stories = true
    @AppStorage("explore") var explore = true
    var body: some View {
        NavigationStack {
            Form {
                Section("Blocked features") {
                    Toggle("Feeds", isOn: $feeds); Toggle("Reels / videos", isOn: $reels)
                    Toggle("Stories", isOn: $stories); Toggle("Discovery", isOn: $explore)
                }
                Section {
                    Text("Protection applies inside this browser. Original native apps remain unfiltered. Live compatibility, login, posting and free signing require device validation.")
                    Text("Safari is separate: enable its extension and website permissions in iPhone Settings. Its personal signing support remains unverified.")
                    Text("No analytics or project server. Login sessions stay in WebKit storage. Disabling filters permits consumption.")
                }
            }.navigationTitle("Settings").toolbar { Button("Done") { model.installScripts(); dismiss() } }
                .onDisappear { model.installScripts() }
        }
    }
}
