const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const pool = require('./database'); // Đảm bảo file database.js của bạn đã được cấu hình

// --- KHỞI TẠO ỨNG DỤNG ---
const app = express();
const port = 5000;

// --- CẤU HÌNH MIDDLEWARE ---

// 1. CORS
const allowedOrigins = [
  'https://hrm.info.aipencil.name.vn',
  'http://localhost:3000'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// 2. Middleware cho file tĩnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });


// --- ĐỊNH NGHĨA API ROUTE ---
app.options('/hrminfo', cors()); // Xử lý CORS Preflight

app.post(
  '/hrminfo',
  upload.fields([
    { name: 'staffPhoto', maxCount: 1 },
    { name: 'citizenFront', maxCount: 1 },
    { name: 'citizenBack', maxCount: 1 }
  ]),
  async (req, res) => {
    console.log('Received data at /hrminfo:');
    console.log('Text Fields (req.body):', req.body);
    console.log('Uploaded Files (req.files):', req.files);

    const form = req.body;
    const files = req.files;

    if (!form || Object.keys(form).length === 0) {
      return res.status(400).json({ success: false, error: 'Không nhận được dữ liệu từ form.' });
    }

    const staffPhotoPath = files?.staffPhoto?.[0]?.path || null;
    const citizenFrontPath = files?.citizenFront?.[0]?.path || null;
    const citizenBackPath = files?.citizenBack?.[0]?.path || null;

    try {
      // SỬA LỖI: Cập nhật câu lệnh INSERT để khớp với schema
      // Sử dụng dấu "" để đảm bảo tên cột case-sensitive
      const query = `
        INSERT INTO hrminfo (
          "Ho_Va_Ten", "Gioi_Tinh", "Ngay_Thang_Nam_Sinh", "Hinh_Thuc_Cong_Viec", "Ngay_Bat_Dau_Lam_Viec", 
          "Hinh_Thuc_Lam_Viec", "Chuc_Vu", "Phong_Ban", "Thuong_Hieu", "Noi_Lam_Viec", "Ten_Nganh", 
          "Ten_Truong", "So_Dien_Thoai", "Email", "Link_Facebook", "So_Tai_Khoan_VPBank", 
          "Chu_Tai_Khoan_VPBank", "Chi_Nhanh_VPBank", "So_Can_Cuoc_Cong_Dan", "Dia_Chi_Thuong_Tru", 
          "Dia_Chi_Hien_Tai", "Anh_The_Nhan_Vien_Link", "Anh_CCCD_Mat_Truoc_Link", "Anh_CCCD_Mat_Sau_Link", 
          "Bien_So_Xe", "Tham_Gia_Nhom_Rieng", "Cam_Doan"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        ) RETURNING "id";
      `;

      // SỬA LỖI: Cập nhật mảng values để khớp với câu lệnh INSERT
      const values = [
        form.fullName,          // $1: Ho_Va_Ten
        form.gender,            // $2: Gioi_Tinh
        form.dob || null,       // $3: Ngay_Thang_Nam_Sinh (Gửi null nếu rỗng)
        form.position,          // $4: Hinh_Thuc_Cong_Viec
        form.startDate || null, // $5: Ngay_Bat_Dau_Lam_Viec (Gửi null nếu rỗng)
        form.workType,          // $6: Hinh_Thuc_Lam_Viec
        form.role,              // $7: Chuc_Vu
        form.department,        // $8: Phong_Ban
        form.memberOf,          // $9: Thuong_Hieu
        form.workPlace,         // $10: Noi_Lam_Viec
        form.unitName,          // $11: Ten_Nganh
        form.schoolName,        // $12: Ten_Truong (Thêm mới)
        form.phone,             // $13: So_Dien_Thoai
        form.email,             // $14: Email
        form.facebook,          // $15: Link_Facebook
        form.vpBankAccount,     // $16: So_Tai_Khoan_VPBank
        form.vpBankOwner,       // $17: Chu_Tai_Khoan_VPBank
        form.vpBankBranch,      // $18: Chi_Nhanh_VPBank
        form.citizenId,         // $19: So_Can_Cuoc_Cong_Dan
        form.permanentAddress,  // $20: Dia_Chi_Thuong_Tru
        form.currentAddress,    // $21: Dia_Chi_Hien_Tai
        staffPhotoPath,         // $22: Anh_The_Nhan_Vien_Link
        citizenFrontPath,       // $23: Anh_CCCD_Mat_Truoc_Link
        citizenBackPath,        // $24: Anh_CCCD_Mat_Sau_Link
        form.vehiclePlate,      // $25: Bien_So_Xe
        form.joinInternalGroup, // $26: Tham_Gia_Nhom_Rieng (Đã là 1 hoặc 0)
        form.confirm            // $27: Cam_Doan (Cột này là TEXT, nhưng giá trị 1/0 vẫn chấp nhận được)
      ];

      const result = await pool.query(query, values);
      res.status(201).json({ success: true, message: 'Thông tin đã được lưu thành công!', id: result.rows[0].id });

    } catch (err) {
      console.error('Database Error:', err.stack);
      res.status(500).json({ success: false, error: 'Lỗi khi lưu thông tin vào cơ sở dữ liệu. Chi tiết: ' + err.message });
    }
  }
);

// --- KHỞI ĐỘNG SERVER ---
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
