
test:
	node_modules/.bin/istanbul cover node_modules/.bin/_mocha \
		-- -b -R tap tests

browserfiles:
	./bin/bundle browser/nunjucks
	SLIM=1 ./bin/bundle browser/nunjucks-slim
