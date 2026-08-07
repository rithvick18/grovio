import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

SupabaseClient get supabase => Supabase.instance.client;

class PickingNotifier extends StateNotifier<AsyncValue<void>> {
  PickingNotifier() : super(const AsyncValue.data(null));

  Future<void> toggleItemPicked(String itemId, bool currentPickedState) async {
    state = const AsyncValue.loading();
    try {
      // Direct Supabase update triggers Realtime broadcast to Customer App
      await supabase
          .from('order_items')
          .update({'is_picked': !currentPickedState})
          .eq('id', itemId);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final pickingProvider = StateNotifierProvider<PickingNotifier, AsyncValue<void>>((ref) {
  return PickingNotifier();
});
