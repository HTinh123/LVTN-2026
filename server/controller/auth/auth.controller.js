const db = require('../../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';


// Helper: Extract start year from MSSV
function getStartYearFromMssv(mssv) {
    // Format: DH5XXYYYYY where XX is two-digit year (e.g., 20 for 2020)
    if (!/^DH5\d{2}/.test(mssv)) {
        throw new Error('Invalid MSSV format: must start with DH5 followed by two-digit year');
    }
    const yearStr = mssv.substring(3, 5); // "20"
    return 2000 + parseInt(yearStr, 10);
}

function calculateValidUntil(mssv) {
    const startYear = getStartYearFromMssv(mssv);
    const validUntilYear = startYear + 6;
    const validUntil = new Date(validUntilYear, 0, 1);
    return validUntil.toISOString().split('T')[0];
}




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
    // Pattern: STU + last 4 digits + #
    // Example: DH52001001 -> STU1001#
    const digits = mssv.replace(/[^0-9]/g, '');
    const letters = mssv.replace(/[0-9]/g, '');
    
    // Get last 4 digits
    const last4Digits = digits.slice(-4);
    
    
    
    return `STU${last4Digits}#`;
}



const authController = {

 // Helper: Create sinhvien_lop and bangdiem records for all semesters (8 semesters)
createStudentEnrollments: async (mssv, mslop, connection = null) => {
    const dbConnection = connection || db;
    try {
        // 1. Extract start year from MSSV
        const startYear = getStartYearFromMssv(mssv);
        
        // 2. Check if class exists
        const [classCheck] = await dbConnection.query(
            "SELECT mslop FROM lop WHERE mslop = ?",
            [mslop]
        );
        if (classCheck.length === 0) {
            throw new Error('Class not found');
        }

        // 3. Get all hocky for years from startYear to startYear + 3
        const [hockyList] = await dbConnection.query(
            `SELECT ms_hocky, hocky, nam 
             FROM hocky 
             WHERE nam BETWEEN ? AND ? 
             ORDER BY nam, hocky`,
            [startYear, startYear + 3]
        );

        // Build map: key = year + '_' + semester, value = ms_hocky
        const hockyMap = new Map();
        hockyList.forEach(h => {
            const key = `${h.nam}_${h.hocky}`;
            hockyMap.set(key, h.ms_hocky);
        });

        // 4. Build list of required semesters (8 semesters)
        const requiredSemesters = [];
        for (let i = 0; i < 4; i++) {
            const year = startYear + i;
            for (const semester of [1, 2]) {
                const key = `${year}_${semester}`;
                const ms_hocky = hockyMap.get(key);
                if (!ms_hocky) {
                    throw new Error(`Missing hocky record for year ${year}, semester ${semester}`);
                }
                requiredSemesters.push({
                    ms_hocky,
                    mslop,
                    mssv
                });
            }
        }

        // 5. Insert all enrollments and bangdiem records
        for (const enrollment of requiredSemesters) {
            // Insert into sinhvien_lop
            await dbConnection.query(
                `INSERT INTO sinhvien_lop (mssv, mslop, ms_hocky) 
                 VALUES (?, ?, ?)`,
                [enrollment.mssv, enrollment.mslop, enrollment.ms_hocky]
            );
            
            // Insert into bangdiem with default values
            await dbConnection.query(
                `INSERT INTO bangdiem (mssv, ms_hocky, diem_tong, xeploai) 
                 VALUES (?, ?, ?, ?)`,
                [enrollment.mssv, enrollment.ms_hocky, 0, 'Chưa xếp loại']
            );
        }

        return { 
            success: true, 
            enrolledSemesters: requiredSemesters.length,
            bangdiemRecords: requiredSemesters.length
        };
    } catch (err) {
        throw err;
    }
},

// Helper: Create cvht_lop records for a CVHT across semesters
createCvhtLopAssignments: async (ms_cvht, mslop, start_ms_hocky, end_ms_hocky, connection = null) => {
    const dbConnection = connection || db;
    try {
        // 1. Check if CVHT exists
        const [cvht] = await dbConnection.query(
            "SELECT ms_cvht, hoten FROM cvht WHERE ms_cvht = ?",
            [ms_cvht]
        );
        if (cvht.length === 0) {
            throw new Error('CVHT not found');
        }

        // 2. Check if class exists
        const [classCheck] = await dbConnection.query(
            "SELECT mslop FROM lop WHERE mslop = ?",
            [mslop]
        );
        if (classCheck.length === 0) {
            throw new Error('Class not found');
        }

        // 3. Check if start semester exists and get its info
        const [startHocky] = await dbConnection.query(
            `SELECT ms_hocky, hocky, nam FROM hocky WHERE ms_hocky = ?`,
            [start_ms_hocky]
        );
        if (startHocky.length === 0) {
            throw new Error('Start semester not found');
        }

        // 4. Check if end semester exists and get its info
        const [endHocky] = await dbConnection.query(
            `SELECT ms_hocky, hocky, nam FROM hocky WHERE ms_hocky = ?`,
            [end_ms_hocky]
        );
        if (endHocky.length === 0) {
            throw new Error('End semester not found');
        }

        // 5. Get all semesters between start and end chronologically
        // Find semesters where (year > startYear) OR (year == startYear AND semester >= startSemester)
        // AND (year < endYear) OR (year == endYear AND semester <= endSemester)
        const startYear = startHocky[0].nam;
        const startSem = parseInt(startHocky[0].hocky);
        const endYear = endHocky[0].nam;
        const endSem = parseInt(endHocky[0].hocky);

        // Convert to comparable values: year * 10 + semester
        const startValue = startYear * 10 + startSem;
        const endValue = endYear * 10 + endSem;

        if (endValue < startValue) {
            throw new Error('End semester must be after start semester');
        }

        // Get all semesters using chronological comparison with a subquery
        const [semesters] = await dbConnection.query(
            `SELECT ms_hocky, hocky, nam 
             FROM hocky 
             WHERE (nam * 10 + CAST(hocky AS UNSIGNED)) BETWEEN ? AND ?
             ORDER BY nam, hocky`,
            [startValue, endValue]
        );

        if (semesters.length === 0) {
            throw new Error('No semesters found in the specified range');
        }

        // 6. Check if any assignments already exist for these semesters
        const placeholders = semesters.map(() => '?').join(',');
        const [existingAssignments] = await dbConnection.query(
            `SELECT ms_hocky FROM cvht_lop 
             WHERE ms_cvht = ? AND mslop = ? AND ms_hocky IN (${placeholders})`,
            [ms_cvht, mslop, ...semesters.map(s => s.ms_hocky)]
        );

        if (existingAssignments.length > 0) {
            const existingSemesters = existingAssignments.map(e => e.ms_hocky);
            throw new Error(`CVHT already assigned to this class for semester(s): ${existingSemesters.join(', ')}`);
        }

        // 7. Insert all cvht_lop records
        let insertedCount = 0;
        for (const semester of semesters) {
            await dbConnection.query(
                `INSERT INTO cvht_lop (ms_cvht, mslop, ms_hocky) 
                 VALUES (?, ?, ?)`,
                [ms_cvht, mslop, semester.ms_hocky]
            );
            insertedCount++;
        }

        return { 
            success: true, 
            assignedSemesters: insertedCount,
            startSemester: startHocky[0],
            endSemester: endHocky[0],
            semesters: semesters
        };
    } catch (err) {
        throw err;
    }
},
   
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
    const { ms_cvht, hoten, username, password, mslop, start_ms_hocky, end_ms_hocky } = req.body;
    
    console.log('Register CVHT called:', { ms_cvht, username, hoten, mslop, start_ms_hocky, end_ms_hocky });
    
    // Validate required fields
    if (!ms_cvht || !hoten || !username || !password) {
        return res.status(400).json({
            success: false,
            error: 'All fields are required: ms_cvht, hoten, username, password'
        });
    }
    
    // Validate class and semester fields for assignment
    if (!mslop) {
        return res.status(400).json({
            success: false,
            error: 'Class (mslop) is required'
        });
    }
    
    if (!start_ms_hocky || !end_ms_hocky) {
        return res.status(400).json({
            success: false,
            error: 'Start and end semesters are required'
        });
    }
    
    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'Password must be at least 6 characters long'
        });
    }
    
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. Check if ms_cvht already exists
        const [existingMsCvht] = await connection.query(
            "SELECT ms_cvht FROM cvht WHERE ms_cvht = ?",
            [ms_cvht]
        );
        
        if (existingMsCvht.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                error: 'CVHT ID (ms_cvht) already exists'
            });
        }
        
        // 2. Check if username already exists
        const [existingUsername] = await connection.query(
            "SELECT username FROM cvht WHERE username = ?",
            [username]
        );
        
        if (existingUsername.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                error: 'Username already exists'
            });
        }
        
        // 3. Check if start semester exists
        const [startHocky] = await connection.query(
            "SELECT ms_hocky, hocky, nam FROM hocky WHERE ms_hocky = ?",
            [start_ms_hocky]
        );
        if (startHocky.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Start semester not found'
            });
        }
        
        // 4. Check if end semester exists
        const [endHocky] = await connection.query(
            "SELECT ms_hocky, hocky, nam FROM hocky WHERE ms_hocky = ?",
            [end_ms_hocky]
        );
        if (endHocky.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'End semester not found'
            });
        }
        
        // 5. Check if end semester is after start semester (by year and semester)
        // Convert to comparable values: year * 2 + semester_number
        const startValue = startHocky[0].nam * 2 + (startHocky[0].hocky === '1' ? 1 : 2);
        const endValue = endHocky[0].nam * 2 + (endHocky[0].hocky === '1' ? 1 : 2);
        
        if (endValue <= startValue) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'End semester must be after start semester'
            });
        }
        
        // 6. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 7. Insert new CVHT
        await connection.query(
            `INSERT INTO cvht (ms_cvht, hoten, username, password) 
             VALUES (?, ?, ?, ?)`,
            [ms_cvht, hoten, username, hashedPassword]
        );
        
        // 8. Create cvht_lop assignments
        const assignmentResult = await authController.createCvhtLopAssignments(
            ms_cvht, 
            mslop, 
            start_ms_hocky, 
            end_ms_hocky, 
            connection
        );
        
        await connection.commit();
        
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
                },
                assignment: assignmentResult
            },
            message: `CVHT account created successfully with ${assignmentResult.assignedSemesters} semester assignment(s)`
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error in registerCvht:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    } finally {
        connection.release();
    }
},

registerStudent: async (req, res) => {
    const { mssv, hoten, mslop, valid_until } = req.body;
    
    console.log('Register student called:', { mssv, hoten, mslop });
    
    // Validate required fields
    if (!mssv || !hoten || !mslop) {
        return res.status(400).json({
            success: false,
            error: 'Required fields: mssv, hoten, mslop'
        });
    }
    
    // Validate MSSV format
    let startYear;
    try {
        startYear = getStartYearFromMssv(mssv);
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    
    // Use provided valid_until or calculate 4 years from now
    const validUntil = valid_until || calculateValidUntil(mssv);
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Check if MSSV already exists
        const [existingMssv] = await connection.query(
            "SELECT mssv FROM sinhvien WHERE mssv = ?",
            [mssv]
        );
        if (existingMssv.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                error: 'Student ID (mssv) already exists'
            });
        }
        
        // 2. Generate username and password
        const username = generateUsername(mssv);
        const password = generatePassword(mssv);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 3. Insert student
        await connection.query(
            `INSERT INTO sinhvien (mssv, username, hoten, password, valid_until) 
             VALUES (?, ?, ?, ?, ?)`,
            [mssv, username, hoten, hashedPassword, validUntil]
        );
        
        // 4. Create semester enrollments
        await authController.createStudentEnrollments(mssv, mslop, connection);
        
        await connection.commit();
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: mssv,
                username: username,
                hoten: hoten,
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
                    valid_until: validUntil,
                    role: 'student'
                }
            },
            message: `Student registered successfully. Username: ${username}, Password: ${password}`
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error in registerStudent:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    } finally {
        connection.release();
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
            
            // Expected headers: mssv,hoten,mslop,valid_until
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= 3) {
                    students.push({
                        mssv: values[0],
                        hoten: values[1],
                        mslop: values[2] || null,
                        valid_until: values[3] || null
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
                        mslop: values[2] || null,
                        valid_until: values[3] || null
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
            
            // Pre-check: Validate all mssv format before processing
            const invalidMssv = [];
            for (const student of students) {
                try {
                    getStartYearFromMssv(student.mssv);
                } catch (err) {
                    invalidMssv.push(student.mssv);
                }
            }
            if (invalidMssv.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: `Invalid MSSV format for: ${invalidMssv.join(', ')}`
                });
            }
            
            for (const student of students) {
                const { mssv, hoten, mslop, valid_until } = student;
                
                try {
                    // Validate required fields
                    if (!mssv || !hoten || !mslop) {
                        results.failed++;
                        results.errors.push({ 
                            mssv: mssv || 'unknown', 
                            error: 'Missing required fields: mssv, hoten, mslop' 
                        });
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
                    
                    // Use provided valid_until or calculate 4 years from now
                    const validUntil = valid_until || calculateValidUntil();
                    
                    // Insert student
                    await connection.query(
                        `INSERT INTO sinhvien (mssv, username, hoten, password, valid_until) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [mssv, username, hoten, hashedPassword, validUntil]
                    );
                    
                    // Create semester enrollments using the helper
                    await this.createStudentEnrollments(mssv, mslop, connection);
                    
                    results.success++;
                } catch (err) {
                    results.failed++;
                    results.errors.push({ 
                        mssv: student.mssv || 'unknown', 
                        error: err.message 
                    });
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
},

// ========== RESET STUDENT PASSWORD ==========
resetStudentPassword: async (req, res) => {
    const { mssv } = req.params;
    
    
    try {
        // Check if student exists
        const [student] = await db.query(
            "SELECT * FROM sinhvien WHERE mssv = ?",
            [mssv]
        );
        
        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        const newPassword = generatePassword(mssv);
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Reset password
        await db.query(
            "UPDATE sinhvien SET password = ? WHERE mssv = ?",
            [hashedPassword, mssv]
        );
        
        res.json({
            success: true,
            message: 'Student password reset successfully',
            data: { newPassword }
        });
    } catch (err) {
        console.error('Error in resetStudentPassword:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== CHANGE PASSWORD FOR STUDENT ==========
changeStudentPassword: async (req, res) => {
    const { mssv } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            error: 'Current password and new password are required'
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
        // Check if student exists
        const [student] = await db.query(
            "SELECT * FROM sinhvien WHERE mssv = ?",
            [mssv]
        );
        
        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        const user = student[0];
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await db.query(
            "UPDATE sinhvien SET password = ? WHERE mssv = ?",
            [hashedPassword, mssv]
        );
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (err) {
        console.error('Error in changeStudentPassword:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== CHANGE PASSWORD FOR STAFF ==========
changeStaffPassword: async (req, res) => {
    const { msnv } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            error: 'Current password and new password are required'
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
        // Check if staff exists
        const [staff] = await db.query(
            "SELECT * FROM nhanvien WHERE msnv = ?",
            [msnv]
        );
        
        if (staff.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Staff not found'
            });
        }
        
        const user = staff[0];
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await db.query(
            "UPDATE nhanvien SET password = ? WHERE msnv = ?",
            [hashedPassword, msnv]
        );
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (err) {
        console.error('Error in changeStaffPassword:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== CHANGE PASSWORD FOR CVHT ==========
changeCvhtPassword: async (req, res) => {
    const { ms_cvht } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            error: 'Current password and new password are required'
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
                error: 'CVHT not found'
            });
        }
        
        const user = cvht[0];
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await db.query(
            "UPDATE cvht SET password = ? WHERE ms_cvht = ?",
            [hashedPassword, ms_cvht]
        );
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (err) {
        console.error('Error in changeCvhtPassword:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},


// ========== EDIT PROFILE FOR ADMIN ==========
editAdminProfile: async (req, res) => {
    const { msnv } = req.params;
    const { hoten, username } = req.body;
    
    // Validate required fields
    if (!hoten && !username) {
        return res.status(400).json({
            success: false,
            error: 'At least one field to update: hoten or username'
        });
    }
    
    try {
        // Check if admin exists (role = 1)
        const [admin] = await db.query(
            "SELECT * FROM nhanvien WHERE msnv = ? AND role = 1",
            [msnv]
        );
        
        if (admin.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Admin not found'
            });
        }
        
        // Build update query
        const updates = [];
        const values = [];
        
        if (hoten) {
            updates.push('hoten = ?');
            values.push(hoten);
        }
        
        if (username) {
            // Check if username already exists (excluding current user)
            const [existingUsername] = await db.query(
                "SELECT msnv FROM nhanvien WHERE username = ? AND msnv != ?",
                [username, msnv]
            );
            
            if (existingUsername.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Username already exists'
                });
            }
            
            updates.push('username = ?');
            values.push(username);
        }
        
        values.push(msnv);
        
        // Update admin profile
        await db.query(
            `UPDATE nhanvien SET ${updates.join(', ')} WHERE msnv = ? AND role = 1`,
            values
        );
        
        // Get updated admin
        const [updatedAdmin] = await db.query(
            "SELECT msnv, hoten, username, role, created_at FROM nhanvien WHERE msnv = ? AND role = 1",
            [msnv]
        );
        
        // Generate new token with updated info
        const token = jwt.sign(
            { 
                id: updatedAdmin[0].msnv,
                username: updatedAdmin[0].username,
                hoten: updatedAdmin[0].hoten,
                role: 'admin',
                is_admin: true
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedAdmin[0],
                token: token
            }
        });
    } catch (err) {
        console.error('Error in editAdminProfile:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== EDIT PROFILE FOR CVHT ==========
editCvhtProfile: async (req, res) => {
    const { ms_cvht } = req.params;
    const { hoten, username } = req.body;
    
    // Validate required fields
    if (!hoten && !username) {
        return res.status(400).json({
            success: false,
            error: 'At least one field to update: hoten or username'
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
                error: 'CVHT not found'
            });
        }
        
        // Build update query
        const updates = [];
        const values = [];
        
        if (hoten) {
            updates.push('hoten = ?');
            values.push(hoten);
        }
        
        if (username) {
            // Check if username already exists (excluding current user)
            const [existingUsername] = await db.query(
                "SELECT ms_cvht FROM cvht WHERE username = ? AND ms_cvht != ?",
                [username, ms_cvht]
            );
            
            if (existingUsername.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Username already exists'
                });
            }
            
            updates.push('username = ?');
            values.push(username);
        }
        
        values.push(ms_cvht);
        
        // Update CVHT profile
        await db.query(
            `UPDATE cvht SET ${updates.join(', ')} WHERE ms_cvht = ?`,
            values
        );
        
        // Get updated CVHT
        const [updatedCvht] = await db.query(
            "SELECT ms_cvht, hoten, username, created_at FROM cvht WHERE ms_cvht = ?",
            [ms_cvht]
        );
        
        // Generate new token with updated info
        const token = jwt.sign(
            { 
                id: updatedCvht[0].ms_cvht,
                username: updatedCvht[0].username,
                hoten: updatedCvht[0].hoten,
                role: 'cvht'
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedCvht[0],
                token: token
            }
        });
    } catch (err) {
        console.error('Error in editCvhtProfile:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== EDIT PROFILE FOR STAFF ==========
editStaffProfile: async (req, res) => {
    const { msnv } = req.params;
    const { hoten, username } = req.body;
    
    // Validate required fields
    if (!hoten && !username) {
        return res.status(400).json({
            success: false,
            error: 'At least one field to update: hoten or username'
        });
    }
    
    try {
        // Check if staff exists
        const [staff] = await db.query(
            "SELECT * FROM nhanvien WHERE msnv = ?",
            [msnv]
        );
        
        if (staff.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Staff not found'
            });
        }
        
        // Build update query
        const updates = [];
        const values = [];
        
        if (hoten) {
            updates.push('hoten = ?');
            values.push(hoten);
        }
        
        if (username) {
            // Check if username already exists (excluding current user)
            const [existingUsername] = await db.query(
                "SELECT msnv FROM nhanvien WHERE username = ? AND msnv != ?",
                [username, msnv]
            );
            
            if (existingUsername.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Username already exists'
                });
            }
            
            updates.push('username = ?');
            values.push(username);
        }
        
        values.push(msnv);
        
        // Update staff profile
        await db.query(
            `UPDATE nhanvien SET ${updates.join(', ')} WHERE msnv = ?`,
            values
        );
        
        // Get updated staff
        const [updatedStaff] = await db.query(
            "SELECT msnv, hoten, username, role, created_at FROM nhanvien WHERE msnv = ?",
            [msnv]
        );
        
        // Determine role name
        const roleName = updatedStaff[0].role === 1 ? 'admin' : 'staff';
        
        // Generate new token with updated info
        const token = jwt.sign(
            { 
                id: updatedStaff[0].msnv,
                username: updatedStaff[0].username,
                hoten: updatedStaff[0].hoten,
                role: roleName,
                is_admin: updatedStaff[0].role === 1
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedStaff[0],
                token: token
            }
        });
    } catch (err) {
        console.error('Error in editStaffProfile:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

};

module.exports = authController;