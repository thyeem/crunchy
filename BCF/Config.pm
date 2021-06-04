use strict;
use warnings;

package BCF::Config;
use base qw / Exporter /;
our @EXPORT = qw / NL GOAL HUMAN SOFIAI MARIAI BLACK WHITE EMPTY VP /;

use constant { 
    NL => 19,
    GOAL => 5,
    HUMAN => 'human',
    SOFIAI => 'sofia',
    MARIAI => 'maria',
    BLACK  => 'b',
    WHITE  => 'w',
    EMPTY  => '',
    VP     => 10,
};

sub new {
    my $class = shift;
    my $self = {
	title      => 'Crunchy',
        template   => 'main.html',
        css_bcf    => 'css/bcf.css',
        css_fa     => 'css/font-awesome.min.css',
        js_bcf     => 'js/bcf.js',
        js_jquery  => 'js/jquery-3.4.1.min.js',
        letter     => 'xxxxx.dat',
        S          => '&nbsp;',
        M          => '&ensp;',
        L          => '&emsp;',
        dash       => '&mdash;',
        method     => 'post',
        cgi        => undef,
        game       => undef,
        keys       => [
                        '78f8ca2251ebb2b0bbfde24ce77e0e99f9c321cc',
                        'dea1e3e99b29a9edbadd649a06e47f04d760aaf7',
                        'aaa6503284a6870515bcff9a0c68b969c94fa61b',
                      ],
        #------------------------------------------------
        HUMAN      => HUMAN,
        SOFIAI     => SOFIAI,
        MARIAI     => MARIAI,
        BLACK      => BLACK,
        WHITE      => WHITE,
        EMPTY      => EMPTY,
        NL         => NL,
        UNIT       => 30,
        timeout    => 180,
        locked     => 0,
        alert      => '',
        view       => '',
        gamelist   => [],
        board      => undef,
        do         => undef,
        id         => undef,
        go         => undef,
        pB         => undef,
        pW         => undef,
        eB         => undef,
        eW         => undef,
        bcf        => undef,
        msg        => undef,
        x          => undef,
        y          => undef,
    };
    bless $self, $class;
    return $self;
}

1;
