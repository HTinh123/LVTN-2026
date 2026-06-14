const db = require('../../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    }
};

module.exports = authController;