#!/usr/bin/env perl

use warnings;
use strict;

use File::Spec;


sub quote_js {
	my ($js) = @_;
	$js =~ s/\\/\\\\/g;
	$js =~ s/'/\\'/g;
	$js =~ s/\n/\\n/g;
	$js =~ s/\t/\\t/g;
	return "'$js'";
}

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
# The sourceURL=### makes it visible in the Webkit debugger
print OUT qq[(function () {
	function load(source, js) {
		window.eval(js + '\\n//\@ sourceURL=' + source);
	}
];

local $/ = undef;
foreach my $source (@in_js) {
	open IN, "<", $source;
	print OUT "\tload(", quote_js($source), ', ', quote_js(<IN>), ");\n";
	close IN;
}

print OUT "})();\n";
close OUT;