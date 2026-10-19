
#!/bin/bash
set -euo pipefail
# Fresh hosted runner only: no user account, pairing records or personal data.
mkdir -p evidence
xcrun simctl list devices available --json > evidence/simulator-devices.json
device=$(python3 - <<'PY'
import json
data=json.load(open('evidence/simulator-devices.json'))['devices']
choices=[(runtime,d) for runtime,devices in data.items() for d in devices if d.get('isAvailable') and d['name'].startswith('iPhone')]
assert choices, 'No free hosted iPhone simulator available'
choices.sort(key=lambda x: ('18-5' not in x[0],x[1]['name']))
runtime,device=choices[0]
json.dump({'runtime':runtime,'device':device['name'],'udid':device['udid'],'physicalDevice':False},open('evidence/simulator-selection.json','w'),indent=2)
print(device['udid'])
PY
)
xcrun simctl boot "$device" || true
xcrun simctl bootstatus "$device" -b
xcodebuild -project apps/ios/SocialFocus.xcodeproj -scheme SocialFocusBrowser -configuration Release -sdk iphonesimulator -destination "id=$device" -derivedDataPath build/simulator CODE_SIGNING_ALLOWED=NO build > evidence/ios-simulator.log 2>&1 || { tail -80 evidence/ios-simulator.log; exit 1; }
xcrun simctl install "$device" build/simulator/Build/Products/Release-iphonesimulator/SocialFocusBrowser.app
xcrun simctl launch --terminate-running-process "$device" org.socialfocus.browser | tee evidence/simulator-launch.txt
sleep 5
xcrun simctl spawn "$device" launchctl list > evidence/simulator-processes.txt
python3 - <<'PY'
import json,os
lines=open('evidence/simulator-processes.txt').read().splitlines()
matches=[line for line in lines if 'org.socialfocus.browser' in line]
assert matches and any(line.split()[0].isdigit() and int(line.split()[0])>0 for line in matches), 'App did not remain running after standalone launch'
selection=json.load(open('evidence/simulator-selection.json'))
selection.update({'releaseAppLaunched':True,'developmentServer':False,'physicalDevice':False,'commit':os.environ['GITHUB_SHA']})
json.dump(selection,open('evidence/simulator-result.json','w'),indent=2)
PY
# No screenshot: the simulator opens a public login page and has no authenticated account.
xcrun simctl shutdown "$device"
