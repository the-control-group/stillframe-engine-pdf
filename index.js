'use strict';

var spawn = require('child_process').spawn;

function sanitize(s) {
	return '\'' + s.replace(/\'/g, '\'\\\'\'') + '\'';
}

function PDFGenerator(config) {
	this.config = config || {};
}

PDFGenerator.prototype.run = function run(request, options) {
	var args = ['--quiet'];

	// add custom headers
	if(typeof request.headers === 'object') Object.keys(request.headers).forEach(function(key) {
		args.push('--header');
		args.push(key);
		args.push(request.headers[key]);
	});

	// add cookies
	if(typeof request.cookies === 'object') Object.keys(request.cookies).forEach(function(key) {
		args.push('--cookie');
		args.push(key);
		args.push(request.cookies[key]);
	});

	// add options
	options = options || {};
	options['page-size'] = options['page-size'] || 'letter';
	Object.keys(options).forEach(function(key) {
		args.push('--' + key);
		args.push(options[key]);
	});

	// set input/output modes
	args.push(request.url);
	args.push('-');

	// spawn the external process
	var child = spawn(this.config.command || 'wkhtmltopdf', args);
	var stream = child.stdout;

	// handle errors
	child.on('error', function(err) { stream.emit('error', err); });
	// child.stderr.on('data', function(err) { stream.emit('error', new Error((err || '').toString().trim())); });

	// send metadata
	setImmediate(function(){
		stream.emit('metadata', {
			contentType: 'application/pdf'
		});
	});

	return stream;
};

module.exports = PDFGenerator;
