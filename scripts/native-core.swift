
import Foundation
import JavaScriptCore
let engine=JSContext()!
engine.evaluateScript(try String(contentsOfFile:"apps/ios/Generated/core.js",encoding:.utf8))
let cases:[(String,String,Bool)]=[
 ("instagram.com","/",true),("instagram.com","/reel/test/",true),("instagram.com","/stories/test/1",true),
 ("instagram.com","/direct/inbox/",false),("instagram.com","/create/select/",false),
 ("tiktok.com","/en/@test/video/1",true),("tiktok.com","/messages",false),("tiktok.com","/upload",false)
]
for (host,path,blocked) in cases {
 let value=engine.objectForKeyedSubscript("SocialFocusCore")!.invokeMethod("decide",withArguments:[host,path,"",["feeds":true,"reels":true,"stories":true,"explore":true]])!.toDictionary()!
 precondition(value["blocked"] as? Bool == blocked,"Native JSCore decision mismatch")
}
let report:[String:Any]=["runtime":"macOS JavaScriptCore native bridge","casesPassed":cases.count,"physicalIPhone":false,"commit":ProcessInfo.processInfo.environment["GITHUB_SHA"] ?? "unknown"]
try FileManager.default.createDirectory(atPath:"evidence",withIntermediateDirectories:true)
try JSONSerialization.data(withJSONObject:report,options:[.prettyPrinted,.sortedKeys]).write(to:URL(fileURLWithPath:"evidence/native-core.json"))
print("Native JSCore bridge assertions passed")
