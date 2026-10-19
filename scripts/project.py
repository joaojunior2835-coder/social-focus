"""Generate a minimal Xcode project using only Python's standard library."""
from pathlib import Path
import json, plistlib

root=Path('apps/ios'); project=root/'SocialFocus.xcodeproj'; project.mkdir(parents=True,exist_ok=True)
objects={}
def add(kind,**kwargs):
    key=f'{len(objects)+1:024X}'
    objects[key]={'isa':kind,**kwargs}
    return key
def ref(path,kind='sourcecode.swift',tree='<group>'):
    return add('PBXFileReference',lastKnownFileType=kind,path=path,sourceTree=tree)
products=add('PBXGroup',children=[],name='Products',sourceTree='<group>')
group=add('PBXGroup',children=[products],sourceTree='<group>')
def configs(name,extra):
    ids=[]
    for mode in ['Debug','Release']:
        settings={'PRODUCT_NAME':'$(TARGET_NAME)','SDKROOT':'iphoneos','SUPPORTED_PLATFORMS':'iphoneos iphonesimulator','IPHONEOS_DEPLOYMENT_TARGET':'16.0','SWIFT_VERSION':'5.0','TARGETED_DEVICE_FAMILY':'1,2','CLANG_ENABLE_MODULES':'YES','CODE_SIGNING_ALLOWED':'NO','SWIFT_OPTIMIZATION_LEVEL':'-Onone' if mode=='Debug' else '-O', 'SWIFT_COMPILATION_MODE':'wholemodule' if mode=='Release' else 'singlefile', **extra}
        ids.append(add('XCBuildConfiguration',buildSettings=settings,name=mode))
    return add('XCConfigurationList',buildConfigurations=ids,defaultConfigurationIsVisible='0',defaultConfigurationName='Release')
def target(name,bundle,sources,resources,plist,extension=False):
    prod=add('PBXFileReference',explicitFileType='wrapper.app-extension' if extension else 'wrapper.application',includeInIndex='0',path=name+('.appex' if extension else '.app'),sourceTree='BUILT_PRODUCTS_DIR')
    objects[products]['children'].append(prod)
    sourceIDs=[]; resourceIDs=[]
    for path in sources:
        r=ref(path);objects[group]['children'].append(r);sourceIDs.append(add('PBXBuildFile',fileRef=r))
    for path in resources:
        ext=Path(path).suffix
        r=ref(path,{'js':'sourcecode.javascript','.json':'text.json'}.get(ext,'text'));objects[group]['children'].append(r);resourceIDs.append(add('PBXBuildFile',fileRef=r))
    phases=[add('PBXSourcesBuildPhase',buildActionMask='2147483647',files=sourceIDs,runOnlyForDeploymentPostprocessing='0'),add('PBXFrameworksBuildPhase',buildActionMask='2147483647',files=[],runOnlyForDeploymentPostprocessing='0'),add('PBXResourcesBuildPhase',buildActionMask='2147483647',files=resourceIDs,runOnlyForDeploymentPostprocessing='0')]
    cfg=configs(name,{'PRODUCT_BUNDLE_IDENTIFIER':bundle,'INFOPLIST_FILE':plist,'GENERATE_INFOPLIST_FILE':'NO','LD_RUNPATH_SEARCH_PATHS':'$(inherited) @executable_path/Frameworks'+(' @executable_path/../../Frameworks' if extension else ''),'APPLICATION_EXTENSION_API_ONLY':'YES' if extension else 'NO','SKIP_INSTALL':'YES' if extension else 'NO'})
    t=add('PBXNativeTarget',buildConfigurationList=cfg,buildPhases=phases,buildRules=[],dependencies=[],name=name,productName=name,productReference=prod,productType='com.apple.product-type.app-extension' if extension else 'com.apple.product-type.application')
    return t,prod
resources=['Generated/core.js','Generated/content.js','Generated/navigation.js','Generated/start.css']
browser,_=target('SocialFocusBrowser','org.socialfocus.browser',['Browser.swift'],resources,'Browser.plist')
safari,sp=target('SocialFocusSafariExtension','org.socialfocus.safari.Extension',['../../extensions/safari/SafariWebExtensionHandler.swift'],['../../dist/safari/'+p for p in ['manifest.json','content.js','navigation.js','start.css','popup.html','popup.js','popup.css']],'SafariExtension.plist',True)
host,_=target('SocialFocusSafari','org.socialfocus.safari',['Browser.swift'],resources,'SafariHost.plist')
embed=add('PBXBuildFile',fileRef=sp,settings={'ATTRIBUTES':['RemoveHeadersOnCopy']})
objects[host]['buildPhases'].append(add('PBXCopyFilesBuildPhase',buildActionMask='2147483647',dstPath='',dstSubfolderSpec='13',files=[embed],name='Embed App Extensions',runOnlyForDeploymentPostprocessing='0'))
objects[host]['dependencies'].append(add('PBXTargetDependency',target=safari))
projectCfg=configs('Project',{'ALWAYS_SEARCH_USER_PATHS':'NO'})
pr=add('PBXProject',attributes={'LastUpgradeCheck':'1640'},buildConfigurationList=projectCfg,compatibilityVersion='Xcode 14.0',developmentRegion='en',hasScannedForEncodings='0',knownRegions=['en','Base'],mainGroup=group,productRefGroup=products,projectDirPath='',projectRoot='',targets=[browser,host,safari])
def serialize(value):
    if isinstance(value,dict):return '{'+''.join(json.dumps(k)+' = '+serialize(v)+';\n' for k,v in value.items())+'}'
    if isinstance(value,list):return '('+','.join(serialize(v) for v in value)+')'
    return json.dumps(str(value))
(project/'project.pbxproj').write_text('// !$*UTF8*$!\n'+serialize({'archiveVersion':'1','classes':{},'objectVersion':'56','objects':objects,'rootObject':pr}))
base={'CFBundleDevelopmentRegion':'en','CFBundleExecutable':'$(EXECUTABLE_NAME)','CFBundleIdentifier':'$(PRODUCT_BUNDLE_IDENTIFIER)','CFBundleInfoDictionaryVersion':'6.0','CFBundleName':'$(PRODUCT_NAME)','CFBundleShortVersionString':'0.1.0','CFBundleVersion':'1','LSRequiresIPhoneOS':True,'UISupportedInterfaceOrientations':['UIInterfaceOrientationPortrait','UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight']}
for name,title in [('Browser','Social Focus'),('SafariHost','Social Focus Safari')]:
    value={**base,'CFBundlePackageType':'APPL','CFBundleDisplayName':title,'UILaunchScreen':{},'NSCameraUsageDescription':'Select or capture content for a platform draft when you choose.','NSMicrophoneUsageDescription':'Record audio for content you choose to create.','NSPhotoLibraryUsageDescription':'Select content to preview and upload when you choose.','UIApplicationSceneManifest':{'UIApplicationSupportsMultipleScenes':False}}
    (root/(name+'.plist')).write_bytes(plistlib.dumps(value))
extension={**base,'CFBundlePackageType':'XPC!','CFBundleDisplayName':'Social Focus filtering','NSExtension':{'NSExtensionPointIdentifier':'com.apple.Safari.web-extension','NSExtensionPrincipalClass':'$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler'}}
(root/'SafariExtension.plist').write_bytes(plistlib.dumps(extension))
schemes=project/'xcshareddata/xcschemes';schemes.mkdir(parents=True,exist_ok=True)
for name,tid in [('SocialFocusBrowser',browser),('SocialFocusSafari',host)]:
    (schemes/(name+'.xcscheme')).write_text(f"""<?xml version="1.0" encoding="UTF-8"?><Scheme LastUpgradeVersion="1640" version="1.3"><BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{tid}" BuildableName="{name}.app" BlueprintName="{name}" ReferencedContainer="container:SocialFocus.xcodeproj"/></BuildActionEntry></BuildActionEntries></BuildAction><LaunchAction buildConfiguration="Debug"/><ProfileAction buildConfiguration="Release"/><AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/></Scheme>""")
print('Generated independent browser and Safari device build schemes; no restricted entitlements.')
