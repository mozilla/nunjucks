# -*- coding: utf-8 -*-

module Jekyll
  module LocaleFilter

    def locale_buttons(url, baseurl)
      if url.start_with?('/cn/')
        en_url = File.join(baseurl, url.sub(/^\/cn\//, '/'))
        cn_url = File.join(baseurl, url)
        fr_url = File.join(baseurl, url.sub(/^\/cn\//, '/fr/'))
        '<a href="' + en_url + '" class="btn btn-default">English</a>' +
          '<a href="' + cn_url + '" class="btn btn-success">中文</a>' +
          '<a href="' + fr_url + '" class="btn btn-default">Français</a>'
      else 
        if url.start_with?('/fr/')
          en_url = File.join(baseurl, url.sub(/^\/fr\//, '/'))
          cn_url = File.join(baseurl, url.sub(/^\/fr\//, '/cn/'))
          fr_url = File.join(baseurl, url)
          '<a href="' + en_url + '" class="btn btn-default">English</a>' +
            '<a href="' + cn_url + '" class="btn btn-default">中文</a>' +
            '<a href="' + fr_url + '" class="btn btn-success">Français</a>'
        else
          en_url = File.join(baseurl, url)
          cn_url = File.join(baseurl, url.sub(/^\//, '/cn/'))
          fr_url = File.join(baseurl, url.sub(/^\//, '/fr/'))
          '<a href="' + en_url + '" class="btn btn-success">English</a>' +
            '<a href="' + cn_url + '" class="btn btn-default">中文</a>' +
            '<a href="' + fr_url + '" class="btn btn-default">Français</a>'
        end
      end
    end

  end
end

Liquid::Template::register_filter(Jekyll::LocaleFilter)
