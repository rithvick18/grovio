import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final supabase = Supabase.instance.client;

// Stream Provider for Order Live Status
final orderSyncProvider = StreamProvider.family<Map<String, dynamic>, String>((ref, orderId) {
  return supabase
      .from('orders')
      .stream(primaryKey: ['id'])
      .eq('id', orderId)
      .map((event) => event.first);
});

// Stream Provider for Item Picking Progress in Customer App
final orderItemsSyncProvider = StreamProvider.family<List<Map<String, dynamic>>, String>((ref, orderId) {
  return supabase
      .from('order_items')
      .stream(primaryKey: ['id'])
      .eq('order_id', orderId);
});
