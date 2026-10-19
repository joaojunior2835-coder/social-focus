import Foundation
import SafariServices

final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        // No native messaging, App Groups, cookies, or user-data access is needed.
        context.completeRequest(returningItems: [], completionHandler: nil)
    }
}
