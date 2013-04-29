#!/usr/bin/env perl

use warnings;
use strict;

use File::Spec;

# We don't compile anything.  Just concatenate files and load them for debugging.
my @in_js;
my $out_js;
my @other_options;

for (my $i = 0; $i <= $#ARGV; ++$i) {
	my $arg = $ARGV[$i];
	my ($arg_key, $arg_value) = ($arg =~ /^(--[^=]+)(?:=(.*))?$/);
	if (!defined $arg_key) {
		die "Can't find $arg" unless -e $arg;
		push @in_js, $arg;
	} elsif ("--js_output_file" eq $arg_key) {
		$out_js = defined $arg_value ? $arg_value : $ARGV[++$i];
	} else {
		push @other_options, $arg;
	}
}

die "Missing --js_output_file" unless $out_js;

# Test compile
my ($vol, $dir) = File::Spec->splitpath($0);
my $test_compile = join(' ', 'java -jar', File::Spec->catfile($dir, 'compiler.jar'), @other_options, '--js_output_file', $out_js, @in_js);
die unless system($test_compile) == 0;

open OUT, ">", $out_js;
print OUT qq[(function(\$) {
if (\$.browser.msie && /^[1-8]\\./.test(\$.browser.version)) {
	// Output in delayed chunks so IE isn't overloaded
	var c = window.console;
	var time = new Date().getTime();
	var buffer = undefined;
	window.console = {
		log: function() {
			if (buffer === undefined) {
				buffer = [];
				setTimeout(function() {
					if (c) c.log(buffer.join("\\n"));
					buffer = undefined;
				}, 100);
			}
			buffer.push(Array.prototype.join.call(arguments, ' '));
		}
	}
	console.log("IE console.log delayed");
}
];

local $/ = undef;
foreach my $source (@in_js) {
	open IN, "<", $source;
	print OUT '/', '*'x79, "\n $source\n", '*'x79, "/\n\n", <IN>, "\n\n";
	close IN;
}

print OUT "})(jQuery);\n";
close OUT;