/**
 * Generate student email from MSSV
 * @param {string} mssv - Student ID (e.g., DH52001001)
 * @returns {string} - Student email (e.g., dh52001001@student.stu.edu.vn)
 */
function generateStudentEmail(mssv) {
    if (!mssv) {
        throw new Error('MSSV is required');
    }
    
    // Convert to lowercase and ensure it follows the pattern
    const cleanMssv = mssv.trim().toLowerCase();
    
    // Validate MSSV format (DH5 followed by 7 digits)
    const mssvPattern = /^dh5\d{7}$/;
    if (!mssvPattern.test(cleanMssv)) {
        throw new Error('Invalid MSSV format. Must be DH5 followed by 7 digits (e.g., DH52001001)');
    }
    
    // Generate email: dh5XXXXXXX@student.stu.edu.vn
    return `${cleanMssv}@student.stu.edu.vn`;
}

/**
 * Generate student email with custom domain
 * @param {string} mssv - Student ID
 * @param {string} domain - Custom domain (default: student.stu.edu.vn)
 * @returns {string} - Student email
 */
function generateStudentEmailWithDomain(mssv, domain = 'student.stu.edu.vn') {
    if (!mssv) {
        throw new Error('MSSV is required');
    }
    
    const cleanMssv = mssv.trim().toLowerCase();
    
    // Validate MSSV format
    const mssvPattern = /^dh5\d{7}$/;
    if (!mssvPattern.test(cleanMssv)) {
        throw new Error('Invalid MSSV format. Must be DH5 followed by 7 digits (e.g., DH52001001)');
    }
    
    return `${cleanMssv}@${domain}`;
}

/**
 * Extract username from email
 * @param {string} email - Student email
 * @returns {string} - MSSV (username part)
 */
function extractMssvFromEmail(email) {
    if (!email) {
        throw new Error('Email is required');
    }
    
    const cleanEmail = email.trim().toLowerCase();
    const atIndex = cleanEmail.indexOf('@');
    
    if (atIndex === -1) {
        throw new Error('Invalid email format');
    }
    
    return cleanEmail.substring(0, atIndex);
}

/**
 * Validate student email format
 * @param {string} email - Student email
 * @param {string} domain - Domain to validate against (optional)
 * @returns {boolean} - True if valid
 */
function isValidStudentEmail(email, domain = 'student.stu.edu.vn') {
    if (!email) return false;
    
    const cleanEmail = email.trim().toLowerCase();
    const parts = cleanEmail.split('@');
    
    if (parts.length !== 2) return false;
    
    const [username, emailDomain] = parts;
    
    // Check domain
    if (emailDomain !== domain) return false;
    
    // Check username format (dh5 followed by 7 digits)
    const mssvPattern = /^dh5\d{7}$/;
    return mssvPattern.test(username);
}

/**
 * Batch generate emails for multiple MSSVs
 * @param {string[]} mssvList - Array of MSSVs
 * @returns {Object[]} - Array of {mssv, email} objects
 */
function generateStudentEmailsBatch(mssvList) {
    if (!mssvList || !Array.isArray(mssvList)) {
        throw new Error('MSSV list must be an array');
    }
    
    return mssvList.map(mssv => {
        try {
            return {
                mssv: mssv,
                email: generateStudentEmail(mssv),
                success: true
            };
        } catch (error) {
            return {
                mssv: mssv,
                email: null,
                success: false,
                error: error.message
            };
        }
    });
}

module.exports = {
    generateStudentEmail,
    generateStudentEmailWithDomain,
    extractMssvFromEmail,
    isValidStudentEmail,
    generateStudentEmailsBatch
};