#!/bin/bash
set -euo pipefail
mkdir -p evidence dist/ios
xcodebuild -version | tee evidence/xcode.txt
xcodebuild -showsdks >> evidence/xcode.txt
python3 scripts/project.py
for component in Browser Safari; do
  xcodebuild -project apps/ios/SocialFocus.xcodeproj -scheme "SocialFocus${component}" -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath "build/${component}" CODE_SIGNING_ALLOWED=NO build > "evidence/ios-${component}.log" 2>&1 || { tail -100 "evidence/ios-${component}.log"; exit 1; }
  mkdir -p "build/package-${component}/Payload"
  cp -R "build/${component}/Build/Products/Release-iphoneos/SocialFocus${component}.app" "build/package-${component}/Payload/"
  (cd "build/package-${component}" && zip -qr "../../dist/ios/SocialFocus-${component}-UNSIGNED.ipa" Payload)
done
python3 scripts/verify_ipa.py
printf '%s\n' "$GITHUB_SHA" > dist/ios/SOURCE_COMMIT.txt
(cd dist/ios && shasum -a 256 *.ipa > SHA256SUMS)
