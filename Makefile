build:
	cd app && npm run build
	cp -rf app/build/* sketch/assets/resources/
	cd sketch && npm run build
