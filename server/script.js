const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createCvht() {
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Full hash:', hashedPassword);
    console.log('Hash length:', hashedPassword.length); // Should be 60
    
    // Your database connection
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'drl_db'
    });
    
    await connection.execute(
        `INSERT INTO cvht (ms_cvht, username, hoten, password) 
         VALUES (?, ?, ?, ?)`,
        ['CVHT0001', 'advisor1', 'CVHT 1', hashedPassword]
    );
    
    console.log('CVHT created successfully!');
    await connection.end();
}

createCvht().catch(console.error);