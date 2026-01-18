const bcrypt = require('bcrypt');

const password = 'Miriam@123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }

    console.log('\n==============================================');
    console.log('PASSWORD HASH GENERATED');
    console.log('==============================================');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('==============================================\n');
    console.log('Copy this hash to your SQL file:');
    console.log(hash);
    console.log('\n');
});
