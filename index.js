'use strict';

var spawn = require('child_process').spawn;

function sanitize(s) {
	return '\'' + s.replace(/\'/g, '\'\\\'\'') + '\'';
}

function PDFGenerator(config) {
	this.config = config || {};
}

PDFGenerator.prototype.run = function run(request, options) {
	var args = [this.config.command || 'wkhtmltopdf', '--quiet'];

	// add custom headers
	if(typeof request.headers === 'object') Object.keys(request.headers).forEach(function(key) {
		args.push('--header');
		args.push(sanitize(key));
		args.push(sanitize(request.headers[key]));
	});

	// add cookies
	if(typeof request.cookies === 'object') Object.keys(request.cookies).forEach(function(key) {
		args.push('--cookie');
		args.push(sanitize(key));
		args.push(sanitize(request.cookies[key]));
	});

	// add options
	options = options || {};
	options['page-size'] = options['page-size'] || 'letter';
	Object.keys(options).forEach(function(key) {
		args.push('--' + key);
		args.push(sanitize(options[key]));
	});

	// set input/output modes
	args.push(sanitize(request.url));
	args.push('-');

	// spawn the external process
	var child = spawn('/bin/sh', ['-c', args.join(' ') + ' | cat']);
	var stream = child.stdout;

	// handle errors
	child.on('error', function(err) { stream.emit('error', err); });
	child.stderr.on('data', function(err) { stream.emit('error', new Error((err || '').toString().trim())); });

	// send metadata
	setImmediate(function(){
		stream.emit('metadata', {
			contentType: 'application/pdf'
		});
	});

	return stream;
};

module.exports = PDFGenerator;
