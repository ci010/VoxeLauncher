#/bin/sh

VOLUME=`hdiutil attach "./temp/jre_mac.dmg" | grep /Volumes | sed 's/.*\/Volumes\//\/Volumes\//'`
installer -pkg "$VOLUME/Java 8 Update 211.app/Contents/Resources/JavaAppletPlugin.pkg" -target "./jre"
hdiutil detach "$VOLUME"
