
test: 
	./node_modules/mocha/bin/mocha -b -R tap tests

browserfiles:
	./bin/bundle browser/nunjucks-dev.js
	SLIM=1 ./bin/bundle browser/nunjucks.js
	cd browser && ../node_modules/.bin/uglifyjs nunjucks.js > nunjucks-min.js
