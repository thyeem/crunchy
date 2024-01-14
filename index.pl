#!/usr/bin/perl

use strict;
use warnings;

BEGIN { unshift @INC, '.'; }
use BCF::Web;

my $cgi = CGI->new();
my $web = BCF::Web->new($cgi);

$web->process;
$web->dump_template;
