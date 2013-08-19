# encoding: utf-8
import base62
import urllib
import unicodedata
from google.appengine.ext import db


class Url(db.Model):
	url = db.StringProperty()


class UrlHits(db.Model):
	url_ref = db.ReferenceProperty(Url)
	#hits = db.IntegerProperty(default = 0)
	date = db.DateTimeProperty(auto_now_add=True)
	referer = db.StringProperty()
	ip_address = db.StringProperty()
	user_agent = db.StringProperty()


def set_url(url_string, info):
	encoded = urllib.quote_plus(urllib.unquote(url_string))

	url = Url.all().filter('url =', encoded).get()

	if url is not None:
		new_id_num = url.key().id()
	else:
		handmade_key = db.Key.from_path('Url', 1)
		new_ids = db.allocate_ids(handmade_key, 1)

		new_id_num = int(new_ids[0])
	
		new_key = db.Key.from_path('Url', new_id_num)
		url = Url(key = new_key)
		url.url = encoded
		url.put()

		__hit(url, info)
	
	return base62.encode(new_id_num)


def __hit(url, info):
	hit = UrlHits(url_ref = url)

	if info is not None:
		hit.referer = info['referer']
		hit.ip_address = info['ip_address']
		hit.user_agent = info['user_agent']

	hit.put()


def get_url(url_code, info):
	url_id = base62.decode(url_code)
	url = Url.get_by_id(url_id)
	
	'''
	hit = UrlHits.all().filter('url_ref =', url.key()).get()
	if hit is not None:
		hit.hits += 1
		hit.put()
	'''
	__hit(url, info)
	
	return unicodedata.normalize('NFKD', urllib.unquote(url.url)).encode('ascii','ignore')
