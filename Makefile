build:
	cd app && npm run build
	rm -rf sketch/gaia-sketch.sketchplugin
	cp -rf app/build/* sketch/assets/resources/
	cd sketch && npm run build
