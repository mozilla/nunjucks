
test: 
	./node_modules/mocha/bin/mocha -b -R tap tests

browserfiles:
	./bin/bundle browser/nunjucks.js
	SLIM=1 ./bin/bundle browser/nunjucks-slim.js
	cd browser && ../node_modules/.bin/uglifyjs nunjucks.js > nunjucks.min.js
	cd browser && ../node_modules/.bin/uglifyjs nunjucks-slim.js > nunjucks-slim.min.js
