# encoding: utf-8
import base62
import urllib
import unicodedata
from google.appengine.ext import db
from google.appengine.api import memcache


class Url(db.Model):
	url = db.StringProperty()


class UrlHits(db.Model):
	url_ref = db.ReferenceProperty(Url)
	#hits = db.IntegerProperty(default = 0)
	date = db.DateTimeProperty(auto_now_add=True)
	referer = db.StringProperty()
	ip_address = db.StringProperty()
	user_agent = db.StringProperty()


def set_url(url_string, request):
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

	__hit(url, request)

	code = base62.encode(new_id_num)

	if memcache.get('cacheurls:%s' % code) is None:
		memcache.add('cacheurls:%s' % code, url, 60*60*12)

	return code


def __hit(url, request):
	hit = UrlHits(url_ref = url)

	if request is not None:
		hit.referer = request.referer
		hit.ip_address = request.remote_addr
		hit.user_agent = request.headers['user-agent']

	hit.put()


def get_url(url_code, request):
	url = memcache.get('cacheurls:%s' % url_code)
	if url is None:
		url_id = base62.decode(url_code)
		url = Url.get_by_id(url_id)
	
	if url is None:
		return None
	'''
	hit = UrlHits.all().filter('url_ref =', url.key()).get()
	if hit is not None:
		hit.hits += 1
		hit.put()
	'''
	__hit(url, request)
	
	try:
		url_str = unicodedata.normalize('NFKD', urllib.unquote(url.url)).encode('ascii','ignore')
	except Exception:
		url_str = urllib.unquote(url.url)

	return url_str
