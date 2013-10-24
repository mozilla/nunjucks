
all:
	jekyll serve --watch

prod:
	cp ~/projects/nunjucks/browser/* files
	rsync -avz ~/projects/nunjucks/tests/ files/tests
	jekyll build --config _config.yml,_config-prod.yml
