#!/usr/bin/expect -f

set timeout 30
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null air_publisher_user@93.127.216.83
expect {
    "password:" {
        send "App8899n@123\r"
        exp_continue
    }
    "$ " {
        send "echo 'Connected successfully' && pwd && ls -la\r"
        expect "$ "
        send "exit\r"
    }
    "# " {
        send "echo 'Connected successfully' && pwd && ls -la\r"
        expect "# "
        send "exit\r"
    }
    timeout {
        puts "Connection timed out"
        exit 1
    }
}
expect eof


