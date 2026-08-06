import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../providers/auth_provider.dart';
import '../providers/delivery_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'main_navigation_screen.dart';

class ShopperOnboardingScreen extends StatefulWidget {
  final AuthProvider authProvider;
  final DeliveryProvider deliveryProvider;

  const ShopperOnboardingScreen({
    super.key,
    required this.authProvider,
    required this.deliveryProvider,
  });

  @override
  State<ShopperOnboardingScreen> createState() => _ShopperOnboardingScreenState();
}

class _ShopperOnboardingScreenState extends State<ShopperOnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  String _vehicleType = 'bike';
  bool _isLoading = false;

  final List<String> _vehicleOptions = ['bike', 'scooter', 'car'];

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final user = widget.authProvider.user;
      if (user == null) throw Exception('User not authenticated');

      await Supabase.instance.client.from('profiles').update({
        'role': 'shopper',
        'vehicle_type': _vehicleType,
        'phone': _phoneController.text.trim(),
        'is_onboarded': true,
      }).eq('id', user.id);

      await widget.authProvider.refreshProfile();

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
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
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.delivery_dining,
                      size: 64,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  'Complete Your Profile',
                  style: AppTypography.h1,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Tell us a bit about yourself to start delivering.',
                  style: AppTypography.bodyText.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                Text(
                  'Phone Number',
                  style: AppTypography.h3,
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    hintText: 'Enter your phone number',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary),
                    ),
                    prefixIcon: const Icon(Icons.phone, color: AppColors.textSecondary),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your phone number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                Text(
                  'Vehicle Type',
                  style: AppTypography.h3,
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _vehicleType,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary),
                    ),
                    prefixIcon: const Icon(Icons.two_wheeler, color: AppColors.textSecondary),
                  ),
                  items: _vehicleOptions.map((type) {
                    return DropdownMenuItem(
                      value: type,
                      child: Text(
                        type[0].toUpperCase() + type.substring(1),
                        style: AppTypography.bodyText,
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _vehicleType = value);
                    }
                  },
                ),
                const SizedBox(height: 48),
                SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.textLight,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              color: AppColors.textLight,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            'Complete Profile',
                            style: AppTypography.h3.copyWith(
                              color: AppColors.textLight,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
