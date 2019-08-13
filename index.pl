#!/usr/bin/perl
use strict;
use warnings;
use lib '/home/ubuntu/perl5/lib/perl5';
use BCF::Web;

my $cgi = CGI->new();
my $web = BCF::Web->new($cgi);

$web->process;
$web->dump_template;

