
test: 
	mocha -b -R tap tests

nunjucks.js:
	./bin/bundle browser/nunjucks-full.js
	SLIM=1 ./bin/bundle browser/nunjucks.js
	cd browser && uglifyjs nunjucks.js > nunjucks-min.js
