
all:
	jekyll serve --watch

prod:
	jekyll build --config _config.yml,_config-prod.yml
