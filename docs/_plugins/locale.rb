# -*- coding: utf-8 -*-

module Jekyll
  module LocaleFilter

    def locale_buttons(url, baseurl)
      if url.start_with?('/cn/')
        en_url = File.join(baseurl, url.sub(/^\/cn\//, '/'))
        cn_url = File.join(baseurl, url)
        '<a href="' + en_url + '" class="btn btn-default">English</a>' +
          '<a href="' + cn_url + '" class="btn btn-success">中文</a>'
      else
        en_url = File.join(baseurl, url)
        cn_url = File.join(baseurl, url.sub(/^\//, '/cn/'))
        '<a href="' + en_url + '" class="btn btn-success">English</a>' +
          '<a href="' + cn_url + '" class="btn btn-default">中文</a>'
      end
    end

  end
end

Liquid::Template::register_filter(Jekyll::LocaleFilter)
