
test: 
	./node_modules/mocha/bin/mocha -b -R tap tests

browserfiles:
	./bin/bundle browser/nunjucks
	SLIM=1 ./bin/bundle browser/nunjucks-slim
