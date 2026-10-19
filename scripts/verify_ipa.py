import zipfile,plistlib,json,struct
from pathlib import Path
report=[]
for path in sorted(Path('dist/ios').glob('*.ipa')):
    with zipfile.ZipFile(path) as z:
        names=z.namelist()
        info=next(n for n in names if n.count('/')==2 and n.endswith('/Info.plist'))
        base=info.rsplit('/',1)[0]+'/'
        p=plistlib.loads(z.read(info))
        assert base+p['CFBundleExecutable'] in names
        executable=z.read(base+p['CFBundleExecutable'])
        assert executable[:4] == b'\xcf\xfa\xed\xfe', 'Expected arm64 Mach-O'
        assert struct.unpack_from('<I',executable,4)[0] == 0x100000c, 'Expected ARM64 CPU'
        ncmds=struct.unpack_from('<I',executable,16)[0]; offset=32; targetPlatform=None
        for _ in range(ncmds):
            command,size=struct.unpack_from('<II',executable,offset)
            if command==0x32: targetPlatform=struct.unpack_from('<I',executable,offset+8)[0]
            offset+=size
        assert targetPlatform==2, 'Expected iOS device platform, not iOS Simulator'

        for f in ['core.js','content.js','navigation.js','start.css']: assert base+f in names
        assert not any('embedded.mobileprovision' in n for n in names)
        if 'Safari' in path.name:
            manifestPath=next(n for n in names if n.endswith('.appex/manifest.json'))
            manifest=json.loads(z.read(manifestPath));extensionBase=manifestPath.rsplit('/',1)[0]+'/'
            referenced=[manifest['action']['default_popup']]
            for script in manifest['content_scripts']: referenced+=script.get('js',[])+script.get('css',[])
            if 'background' in manifest: referenced.append(manifest['background']['service_worker'])
            for resource in referenced: assert extensionBase+resource in names, 'Missing extension resource: '+resource

        report.append({'artifact':path.name,'bundle':p['CFBundleIdentifier'],'unsigned':True,'deviceTarget':True,'installTested':False})
assert len(report)==2
Path('evidence/ipa-inspection.json').write_text(json.dumps(report,indent=2))
