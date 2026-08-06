import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'main_navigation_screen.dart';

class OnboardingScreen extends StatefulWidget {
  final AuthProvider authProvider;
  final CartProvider cartProvider;

  const OnboardingScreen({
    Key? key,
    required this.authProvider,
    required this.cartProvider,
  }) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _streetController;
  late TextEditingController _cityController;
  late TextEditingController _zipController;

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final profile = widget.authProvider.profile;
    _nameController = TextEditingController(text: profile?['full_name'] ?? '');
    _phoneController = TextEditingController();
    _streetController = TextEditingController();
    _cityController = TextEditingController();
    _zipController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _zipController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
    });

    try {
      final userId = widget.authProvider.user?.id;
      if (userId == null) throw Exception('User not logged in');

      // 1. Insert address
      await Supabase.instance.client.from('user_addresses').insert({
        'user_id': userId,
        'street': _streetController.text.trim(),
        'city': _cityController.text.trim(),
        'zip_code': _zipController.text.trim(),
      });

      // 2. Update profile
      await Supabase.instance.client.from('profiles').update({
        'phone': _phoneController.text.trim(),
        'full_name': _nameController.text.trim(),
        'is_onboarded': true,
      }).eq('id', userId);

      // 3. Refresh profile
      await widget.authProvider.refreshProfile();

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => MainNavigationScreen(
              provider: widget.cartProvider,
              authProvider: widget.authProvider,
            ),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving details: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Widget _buildTextField(TextEditingController controller, String label, {bool isPhone = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: TextFormField(
        controller: controller,
        keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: AppTypography.bodySm.copyWith(color: AppColors.onSurface.withOpacity(0.6)),
          filled: true,
          fillColor: AppColors.primaryContainer.withOpacity(0.3),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 2),
          ),
        ),
        validator: (value) => value == null || value.isEmpty ? 'Please enter $label' : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                Text(
                  'Complete Your Profile',
                  style: AppTypography.headlineMobile.copyWith(color: AppColors.primary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Just a few more details before we start.',
                  style: AppTypography.bodySm.copyWith(color: AppColors.onSurface.withOpacity(0.7)),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                
                Text('Personal Details', style: AppTypography.titleMd),
                const SizedBox(height: 16),
                _buildTextField(_nameController, 'Full Name'),
                _buildTextField(_phoneController, 'Phone Number', isPhone: true),
                
                const SizedBox(height: 24),
                Text('Delivery Address', style: AppTypography.titleMd),
                const SizedBox(height: 16),
                _buildTextField(_streetController, 'Street Address'),
                _buildTextField(_cityController, 'City'),
                _buildTextField(_zipController, 'Zip Code'),
                
                const SizedBox(height: 40),
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text('Complete Setup', style: AppTypography.titleMd.copyWith(color: Colors.white)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
