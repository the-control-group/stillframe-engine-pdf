'use strict';

// Heavily inspired (aka copied) from https://github.com/devongovett

var spawn = require('child_process').spawn;

function sanitize(s) {

	// LINUX
	if (typeof s === 'string' && process.platform !== 'win32')
		s = '"' + s.replace(/(["\\$`])/g, '\\$1') + '"';

	// WINDOWS
	return s;
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

	var child;

	// WINDOWS - spawn the external process
	if (process.platform === 'win32') {
		child = spawn(args[0], args.slice(1));
	}

	// LINUX - spawn the external process (this nasty business prevents piping problems)
	else {
		child = spawn('/bin/sh', ['-c', args.join(' ') + ' | cat']);
	}


	// handle errors
	var stream = child.stdout;
	function handleError(err) {
		child.kill();
		stream.emit('error', err);
	}

	child.once('error', function(err) { handleError(err); });
	child.stderr.once('data', function(err) { handleError(new Error((err || '').toString().trim())); });

	// send metadata
	setImmediate(function(){
		stream.emit('metadata', {
			contentType: 'application/pdf'
		});
	});

	return stream;
};

module.exports = PDFGenerator;
