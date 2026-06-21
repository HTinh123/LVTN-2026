const db = require('../../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateUsername(mssv) {
    // Remove prefix letters and leading zeros
    // Example: DH52001001 -> 2001001
    const numericPart = mssv.replace(/[^0-9]/g, '');
    // Remove leading zeros and take last 7 digits
    const trimmed = numericPart.replace(/^0+/, '');
    // If the number is too short, pad with zeros
    return trimmed.padStart(7, '0');
}

function generatePassword(mssv) {
    // Pattern: ABC + last 4 digits + # + first 4 characters of MSSV (letters)
    // Example: DH52001001 -> ABC1001#DH52
    const digits = mssv.replace(/[^0-9]/g, '');
    const letters = mssv.replace(/[0-9]/g, '');
    
    // Get last 4 digits
    const last4Digits = digits.slice(-4);
    
    // Get first 4 characters (letters)
    const first4Letters = letters.slice(0, 4).toUpperCase();
    
    return `ABC${last4Digits}#${first4Letters}`;
}

const authController = {
   
    studentLogin: async (req, res) => {
        const { username, password } = req.body;
        
        console.log('Student login attempt:', username);
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }
        
        try {
            const [student] = await db.query(
                "SELECT * FROM sinhvien WHERE username = ?",
                [username]
            );
            
            console.log('Found student:', student.length);
            
            if (student.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
            
            const user = student[0];
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
            
            const token = jwt.sign(
                { 
                    id: user.mssv,
                    username: user.username,
                    hoten: user.hoten,
                    lop: user.lop,
                    role: 'student',
                    drl_latest: user.drl_latest,
                    valid_until: user.valid_until
                },
                JWT_SECRET,
                { expiresIn: '1d' }
            );
            
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.mssv,
                        username: user.username,
                        hoten: user.hoten,
                        
                        lop: user.lop,
                        role: 'student',
                        drl_latest: user.drl_latest,
                        valid_until: user.valid_until
                    }
                },
                message: 'Student login successful'
            });
        } catch (err) {
            console.error('Error in studentLogin:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },

   
    staffLogin: async (req, res) => {
        const { username, password } = req.body;
        
        console.log('Staff login attempt:', username);
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }
        
        try {
            const [staff] = await db.query(
                "SELECT * FROM nhanvien WHERE username = ? AND role = 0",
                [username]
            );
            
            console.log('Found staff:', staff.length);
            
            if (staff.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
            
            const user = staff[0];
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
            
            const token = jwt.sign(
                { 
                    id: user.msnv,
                    username: user.username,
                    
                    hoten: user.hoten,
                    role: 'staff',
                    is_admin: false
                },
                JWT_SECRET,
                { expiresIn: '1d' }
            );
            
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.msnv,
                        username: user.username,
                        hoten: user.hoten,
                        
                        role: 'staff',
                        is_admin: false
                    }
                },
                message: 'Staff login successful'
            });
        } catch (err) {
            console.error('Error in staffLogin:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },

    
    adminLogin: async (req, res) => {
        const { username, password } = req.body;
        
        console.log('Admin login attempt:', username);
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }
        
        try {
            const [admin] = await db.query(
                "SELECT * FROM nhanvien WHERE username = ? AND role = 1",
                [username]
            );
            
            console.log('Found admin:', admin.length);
            
            if (admin.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
            
            const user = admin[0];
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
            
            const token = jwt.sign(
                { 
                    id: user.msnv,
                    username: user.username,
                    
                    hoten: user.hoten,
                    role: 'admin',
                    is_admin: true
                },
                JWT_SECRET,
                { expiresIn: '1d' }
            );
            
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.msnv,
                        username: user.username,
                        hoten: user.hoten,
                        
                        role: 'admin',
                        is_admin: true
                    }
                },
                message: 'Admin login successful'
            });
        } catch (err) {
            console.error('Error in adminLogin:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },



  
    cvhtLogin: async (req, res) => {
        const { username, password } = req.body;
        
        console.log('CVHT login attempt:', username);
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }
        
        try {
            const [cvht] = await db.query(
                "SELECT * FROM cvht WHERE username = ?",
                [username]
            );
            
            console.log('Found CVHT:', cvht.length);
            
            if (cvht.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
            
            const user = cvht[0];
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
            
            const token = jwt.sign(
                { 
                    id: user.ms_cvht,
                    username: user.username,
                    
                    hoten: user.hoten,
                    role: 'cvht'
                },
                JWT_SECRET,
                { expiresIn: '1d' }
            );
            
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.ms_cvht,
                        username: user.username,
                        hoten: user.hoten,
                        
                        role: 'cvht'
                    }
                },
                message: 'CVHT login successful'
            });
        } catch (err) {
            console.error('Error in cvhtLogin:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },

    registerStaff: async (req, res) => {
    const { msnv, hoten, username, password } = req.body;
    
    console.log('Register staff called:', { msnv, username, hoten });
    
    // Validate required fields
    if (!msnv || !hoten || !username || !password) {
        return res.status(400).json({
            success: false,
            error: 'All fields are required: msnv, hoten, username, password'
        });
    }
    
    try {
        // Check if msnv already exists
        const [existingMsnv] = await db.query(
            "SELECT msnv FROM nhanvien WHERE msnv = ?",
            [msnv]
        );
        
        if (existingMsnv.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Staff ID (msnv) already exists'
            });
        }
        
        // Check if username already exists
        const [existingUsername] = await db.query(
            "SELECT username FROM nhanvien WHERE username = ?",
            [username]
        );
        
        if (existingUsername.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Username already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new staff with role = 0 (staff only)
        const [result] = await db.query(
            `INSERT INTO nhanvien (msnv, hoten, username, password, role) 
             VALUES (?, ?, ?, ?, ?)`,
            [msnv, hoten, username, hashedPassword, 0] // role = 0 for staff
        );
        
        // Generate JWT token for the new staff
        const token = jwt.sign(
            { 
                id: msnv,
                username: username,
                hoten: hoten,
                role: 'staff',
                is_admin: false
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    msnv: msnv,
                    hoten: hoten,
                    username: username,
                    role: 0,
                    role_name: 'staff'
                }
            },
            message: 'Staff account created successfully'
        });
    } catch (err) {
        console.error('Error in registerStaff:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== ADMIN RESET STAFF PASSWORD ==========
resetStaffPassword: async (req, res) => {
    const { msnv } = req.params;
    const { newPassword } = req.body;
    
    // Validate required fields
    if (!newPassword) {
        return res.status(400).json({
            success: false,
            error: 'New password is required'
        });
    }
    
    // Validate password length
    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'New password must be at least 6 characters long'
        });
    }
    
    try {
        // Check if staff exists and is not admin
        const [staff] = await db.query(
            "SELECT * FROM nhanvien WHERE msnv = ? AND role = 0",
            [msnv]
        );
        
        if (staff.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Staff member not found'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Reset password
        await db.query(
            "UPDATE nhanvien SET password = ? WHERE msnv = ? AND role = 0",
            [hashedPassword, msnv]
        );
        
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (err) {
        console.error('Error in resetStaffPassword:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

resetCvhtPassword: async (req, res) => {
        const { ms_cvht } = req.params;
        const { newPassword } = req.body;
        
        // Validate required fields
        if (!newPassword) {
            return res.status(400).json({
                success: false,
                error: 'New password is required'
            });
        }
        
        // Validate password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters long'
            });
        }
        
        try {
            // Check if CVHT exists
            const [cvht] = await db.query(
                "SELECT * FROM cvht WHERE ms_cvht = ?",
                [ms_cvht]
            );
            
            if (cvht.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'CVHT member not found'
                });
            }
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Reset password
            await db.query(
                "UPDATE cvht SET password = ? WHERE ms_cvht = ?",
                [hashedPassword, ms_cvht]
            );
            
            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (err) {
            console.error('Error in resetCvhtPassword:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },

    registerCvht: async (req, res) => {
    const { ms_cvht, hoten, username, password } = req.body;
    
    console.log('Register CVHT called:', { ms_cvht, username, hoten });
    
    // Validate required fields
    if (!ms_cvht || !hoten || !username || !password) {
        return res.status(400).json({
            success: false,
            error: 'All fields are required: ms_cvht, hoten, username, password'
        });
    }
    
    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'Password must be at least 6 characters long'
        });
    }
    
    try {
        // Check if ms_cvht already exists
        const [existingMsCvht] = await db.query(
            "SELECT ms_cvht FROM cvht WHERE ms_cvht = ?",
            [ms_cvht]
        );
        
        if (existingMsCvht.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'CVHT ID (ms_cvht) already exists'
            });
        }
        
        // Check if username already exists
        const [existingUsername] = await db.query(
            "SELECT username FROM cvht WHERE username = ?",
            [username]
        );
        
        if (existingUsername.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Username already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new CVHT
        await db.query(
            `INSERT INTO cvht (ms_cvht, hoten, username, password) 
             VALUES (?, ?, ?, ?)`,
            [ms_cvht, hoten, username, hashedPassword]
        );
        
        // Generate JWT token for the new CVHT
        const token = jwt.sign(
            { 
                id: ms_cvht,
                username: username,
                hoten: hoten,
                role: 'cvht'
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    ms_cvht: ms_cvht,
                    hoten: hoten,
                    username: username,
                    role: 'cvht'
                }
            },
            message: 'CVHT account created successfully'
        });
    } catch (err) {
        console.error('Error in registerCvht:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== REGISTER SINGLE STUDENT ==========
registerStudent: async (req, res) => {
    const { mssv, hoten, lop, drl_latest, valid_until } = req.body;
    
    console.log('Register student called:', { mssv, hoten, lop });
    
    // Validate required fields
    if (!mssv || !hoten || !lop) {
        return res.status(400).json({
            success: false,
            error: 'Required fields: mssv, hoten, lop'
        });
    }
    
    try {
        // Check if MSSV already exists
        const [existingMssv] = await db.query(
            "SELECT mssv FROM sinhvien WHERE mssv = ?",
            [mssv]
        );
        
        if (existingMssv.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Student ID (mssv) already exists'
            });
        }
        
        // Check if lop exists
        const [existingLop] = await db.query(
            "SELECT mslop FROM lop WHERE mslop = ?",
            [lop]
        );
        
        if (existingLop.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Class (lop) not found'
            });
        }
        
        // Generate username from MSSV (remove prefix and leading zeros)
        // Example: DH52001001 -> 2001001
        const username = generateUsername(mssv);
        
        // Generate password: ABC + last 4 digits + # + first 4 digits of MSSV
        // Example: DH52001001 -> ABC1001#DH52
        const password = generatePassword(mssv);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Set default values
        const drl = drl_latest || 0;
        const validUntil = valid_until || null;
        
        // Insert student
        await db.query(
            `INSERT INTO sinhvien (mssv, username, hoten, password, drl_latest, lop, valid_until) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [mssv, username, hoten, hashedPassword, drl, lop, validUntil]
        );
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: mssv,
                username: username,
                hoten: hoten,
                lop: lop,
                role: 'student'
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    mssv: mssv,
                    username: username,
                    hoten: hoten,
                    lop: lop,
                    drl_latest: drl,
                    valid_until: validUntil,
                    role: 'student'
                }
            },
            message: `Student registered successfully. Username: ${username}, Password: ${password}`
        });
    } catch (err) {
        console.error('Error in registerStudent:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== BULK REGISTER FROM FILE (CSV/JSON) ==========
bulkRegisterFromFile: async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        
        let students = [];
        const fileContent = req.file.buffer.toString('utf-8');
        
        // Handle CSV file
        if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
            const lines = fileContent.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            
            // Expected headers: mssv,hoten,lop,drl_latest,valid_until
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= 3) {
                    students.push({
                        mssv: values[0],
                        hoten: values[1],
                        lop: values[2],
                        drl_latest: values[3] ? parseInt(values[3]) : 0,
                        valid_until: values[4] || null
                    });
                }
            }
        } 
        // Handle JSON file
        else if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
            const jsonData = JSON.parse(fileContent);
            students = Array.isArray(jsonData) ? jsonData : jsonData.students || [];
        } 
        // Handle TXT file (tab-separated)
        else if (req.file.originalname.endsWith('.txt')) {
            const lines = fileContent.split('\n').filter(line => line.trim());
            for (const line of lines) {
                const values = line.split('\t').map(v => v.trim());
                if (values.length >= 3) {
                    students.push({
                        mssv: values[0],
                        hoten: values[1],
                        lop: values[2],
                        drl_latest: values[3] ? parseInt(values[3]) : 0,
                        valid_until: values[4] || null
                    });
                }
            }
        } else {
            return res.status(400).json({
                success: false,
                error: 'Unsupported file format. Please upload CSV, JSON, or TXT file.'
            });
        }
        
        if (students.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid student data found in file'
            });
        }
        
        // Process bulk registration
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            for (const student of students) {
                const { mssv, hoten, lop, drl_latest, valid_until } = student;
                
                try {
                    // Validate
                    if (!mssv || !hoten || !lop) {
                        results.failed++;
                        results.errors.push({ mssv: mssv || 'unknown', error: 'Missing required fields' });
                        continue;
                    }
                    
                    // Check existing
                    const [existing] = await connection.query(
                        "SELECT mssv FROM sinhvien WHERE mssv = ?",
                        [mssv]
                    );
                    
                    if (existing.length > 0) {
                        results.failed++;
                        results.errors.push({ mssv, error: 'MSSV already exists' });
                        continue;
                    }
                    
                    // Generate credentials
                    const username = generateUsername(mssv);
                    const password = generatePassword(mssv);
                    const hashedPassword = await bcrypt.hash(password, 10);
                    
                    // Insert
                    await connection.query(
                        `INSERT INTO sinhvien (mssv, username, hoten, password, drl_latest, lop, valid_until) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [mssv, username, hoten, hashedPassword, drl_latest || 0, lop, valid_until || null]
                    );
                    
                    results.success++;
                } catch (err) {
                    results.failed++;
                    results.errors.push({ mssv: student.mssv || 'unknown', error: err.message });
                }
            }
            
            await connection.commit();
            
            res.json({
                success: true,
                data: results,
                message: `Bulk registration from file completed. Success: ${results.success}, Failed: ${results.failed}`
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error in bulkRegisterFromFile:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
}

};

module.exports = authController;