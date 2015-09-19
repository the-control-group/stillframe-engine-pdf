'use strict';

var fs = require('fs');
var stream = require('stream');
var assert = require('chai').assert;
var PDFEngine = require('./index.js');

describe('PDFEngine', function(){
	var engine = new PDFEngine();

	it('run', function(done){
		var s = fs.createWriteStream('test1.pdf');
		engine.run({url: 'http://example.com'}).pipe(s)
		.on('finish', done);
	});

});
