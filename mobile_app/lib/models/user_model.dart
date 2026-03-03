enum UserRole { admin, employee, customer }

class UserModel {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final bool isActive;
  final String? createdAt;
  final String? phone;
  final String? address;
  final String? assignedEmployeeId;
  final List<String>? assignedCustomerIds;

  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.isActive = true,
    this.createdAt,
    this.phone,
    this.address,
    this.assignedEmployeeId,
    this.assignedCustomerIds,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    UserRole role;
    switch (json['role']?.toString()) {
      case 'admin':
        role = UserRole.admin;
        break;
      case 'employee':
        role = UserRole.employee;
        break;
      default:
        role = UserRole.customer;
    }
    List<String>? assignedCustomerIds;
    final rawIds = json['assignedCustomerIds'] ?? json['assigned_customer_ids'];
    if (rawIds != null && rawIds is List) {
      assignedCustomerIds =
          rawIds.map((e) => e.toString()).toList();
    }
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ?? json['email']?.toString() ?? '',
      role: role,
      isActive: json['isActive'] == true || json['is_active'] == true,
      createdAt: json['createdAt']?.toString() ?? json['created_at']?.toString(),
      phone: json['phone']?.toString(),
      address: json['address']?.toString(),
      assignedEmployeeId: json['assignedEmployeeId']?.toString() ??
          json['assigned_employee_id']?.toString(),
      assignedCustomerIds: assignedCustomerIds,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'role': role.name,
        'isActive': isActive,
        'createdAt': createdAt,
        'phone': phone,
        'address': address,
        'assignedEmployeeId': assignedEmployeeId,
        'assignedCustomerIds': assignedCustomerIds,
      };

  String get homePath {
    switch (role) {
      case UserRole.admin:
        return '/admin';
      case UserRole.employee:
        return '/employee';
      case UserRole.customer:
        return '/customer';
    }
  }
}
