use strict;
use warnings;

package BCF::Game;
use BCF::Board;
use BCF::Config;
use File::Path qw / make_path /;
use Digest::SHA qw/ sha1_hex sha256_hex /;
use Storable qw/ dclone lock_nstore lock_retrieve /;

sub new {
    my ($class, $id, $__) = @_;
    my $self = {};
    bless $self, $class;
    $self->init;
    $self->load_game($id, $__) if $id;
    $self->new_game unless $id;
    return $self;
}

sub init {
    my $self = shift;
    $self->set_player(HUMAN, HUMAN);
    $self->{eB} = undef;
    $self->{eW} = undef;
    $self->assert_path('sav');
    $self->assert_path('tmp');
    my $file = 'sav/game.list';
    lock_nstore {}, $file unless -e $file;
}

sub destroy {
    my ($self, $id) = @_;
    system "rm -f tmp/$id";
}

sub assert_path {
    my ($self, $path) = @_;
    return if ( -d $path );
    make_path($path, 0, 0777);
}

sub set_bcf_mode {
    my ($self, $on) = @_;
    $self->{board}{bcf} = $on;
}

sub get_bcf_mode {
    my $self = shift;
    return $self->{board}{bcf};
}

sub rand_id {
    return sha1_hex($$ + rand() + time());
}

sub new_game {
    my $self = shift;
    $self->{id} = rand_id();
    $self->{board} = BCF::Board->new;
    $self->{log} = [];
}

sub save_game {
    my ($self, $__) = @_;
    my $id = $self->{id};
    lock_nstore [$self->{board}, $self->{log}], "tmp/$id";
    lock_nstore [$self->{board}, $self->{log}], "sav/$id" if $__;
}

sub load_game {
    my ($self, $id, $__) = @_;
    my $file = ( $__ )? "sav/$id" : "tmp/$id";
    my ($board, $log) = @{ lock_retrieve $file }[0,1];
    $self->{id} = $id;
    $self->{board} = BCF::Board->new($board);
    $self->{log} = $log;
    return unless scalar @{$log};
    $self->{pB} = $log->[-1]{pB};
    $self->{pW} = $log->[-1]{pW};
    $self->{eB} = $log->[-1]{eB};
    $self->{eW} = $log->[-1]{eW};
}

sub load_gamelist {
    my $self = shift;
    my $db = lock_retrieve 'sav/game.list';
    my $res = [];
    for ( sort { $db->{$b}{time} <=> $db->{$a}{time} } keys %{$db} ) {
        push @{ $res }, $db->{$_};
    }
    return $res;
}

sub save_gamelist {
    my ($self, $id, $msg) = @_;
    my $db = lock_retrieve 'sav/game.list';
    $self->save_game(1);
    $db->{$id}{id} = $id;
    $db->{$id}{msg} = $msg;
    $db->{$id}{time} = time();
    lock_nstore $db, 'sav/game.list'
}

sub delete_gamelist {
    my ($self, $id) = @_;
    my $db = lock_retrieve 'sav/game.list';
    for ( keys %{$db} ) {
        delete $db->{$id} if $_ eq $id;
    }
    lock_nstore $db, 'sav/game.list';
    unlink "sav/$id" if -e "sav/$id";
}

sub set_EWP {
    my ($self, $eB, $eW) = @_;
    return if !$eB || !$eW;
    $self->{eB} = $eB;
    $self->{eW} = $eW;
}

sub set_player {
    my ($self, $playerB, $playerW) = @_;
    $self->{pB} = $playerB;
    $self->{pW} = $playerW;
}

sub get_player {
    my ($self, $stone) = @_;
    return $self->{pB} if $stone eq BLACK;
    return $self->{pB} if $stone eq WHITE;
}

sub whose_turn {
    my $self = shift;
    return $self->{board}->whose_turn;
}

sub whose_turn_player {
    my $self = shift;
    return $self->get_player($self->whose_turn);
}

sub make_move {
    my ($self, $x, $y) = @_;
    my $d = {
        'xy' => [$x, $y],
        'pB' => $self->{pB},
        'pW' => $self->{pW},
        'eB' => $self->{eB},
        'eW' => $self->{eW},
    };
    push @{ $self->{log} }, $d if $self->{board}->make_move($x, $y);
}

sub undo_move {
    my $self = shift;
    my $moves = $self->{board}{moves};
    return if $moves < 1;
    $self->goto_move($moves-1);
    pop @{ $self->{log} };
}

sub who_won {
    my $self = shift;
    return BLACK if $self->{board}->get_score(BLACK) >= VP;
    return WHITE if $self->{board}->get_score(WHITE) >= VP;
    my ($x, $y) = $self->{board}->get_last_move;
    return unless $self->{board}->check_quit($x, $y);
    return BLACK if $self->{board}->last_turn eq BLACK;
    return WHITE if $self->{board}->last_turn eq WHITE;
}

sub goto_move {
    my ($self, $n) = @_;
    return if $n < 0;
    $n = ($n > @{ $self->{log} }) ? @{ $self->{log} } : $n;
    if ( $n == 0 ) {
        $self->{board} = BCF::Board->new;
        ($self->{pB}, $self->{pW}) = (HUMAN, HUMAN);
        ($self->{eB}, $self->{eW}) = (undef, undef);
    } else {
        $self->goto_move($n-1);
        my $d = $self->{log}[$n-1];
        my ($x, $y) = @{ $d->{xy} }[0,1];
        $self->{board}->make_move($x, $y);
        ($self->{pB}, $self->{pW}) = ($d->{pB}, $d->{pW});
        ($self->{eB}, $self->{eW}) = ($d->{eB}, $d->{eW});
    }
}

sub ravel_board {
    my $self = shift;
    my @res = ();
    for my $x ( 1 .. NL ) {
        for my $y ( 1 .. NL ) {
            push @res, $self->{board}->get_stone($x, $y);
        }
    }
    return join ':', @res;
}

sub read_api_board {
    my ($self, $api_board, $read_only) = @_;
    open my $fh, '<', $api_board or die "failed: $!";
    my $fs = do { local $\; <$fh> };
    close $fh;
    my @data = split /:/, $fs;
    return if @data != 369;
    $self->{board}->set_last_move(shift @data, shift @data);
    $self->{board}{moves} = shift @data;
    $self->{board}{turn} = itoa(shift @data);
    $self->{board}{last} = ($self->{board}{turn} eq BLACK)? WHITE : BLACK;
    $self->{board}{scoreB} = shift @data;
    $self->{board}{scoreW} = shift @data;
    $self->{eB} = sprintf "%.1f", (shift @data)/10;
    $self->{eW} = sprintf "%.1f", (shift @data)/10;
    $self->{eW} = sprintf "%.1f", 100 - $self->{eB};
    return ($self->{board}->get_last_move, $self->{eB}, $self->{eW}) if $read_only;
    for my $i ( 1 .. NL ) {
        for my $j ( 1 .. NL ) {
            $self->{board}{_}{$i}{$j} = itoa(shift @data);
        }
    }
}

sub write_api_board {
    my ($self, $api_board) = @_;
    my @res = ($self->{board}->get_last_move, $self->{board}{moves});
    push @res, atoi($self->{board}->whose_turn);
    push @res, map { $self->{board}->get_score($_) } (BLACK, WHITE);
    push @res, 500;
    push @res, 500;
    for my $i ( 1 .. NL ) {
        for my $j ( 1 .. NL ) {
            push @res, atoi($self->{board}->get_stone($i, $j));
        }
    }
    open my $fh, '>', $api_board;
    print {$fh} join ':', @res;
    close $fh;
}

sub itoa {
    my $i = shift;
    return BLACK if $i ==  1;
    return WHITE if $i == -1;
    return EMPTY if $i ==  0;
    return undef;
}

sub atoi {
    my $a = shift;
    return  1 if $a eq BLACK;
    return -1 if $a eq WHITE;
    return  0 if $a eq EMPTY;
    return undef;
}

1;
