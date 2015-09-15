
all:
	jekyll serve --watch

prod:
	cp ../browser/* files
	rsync -avz ../tests/ files/tests
	jekyll build --config _config.yml,_config-prod.yml
