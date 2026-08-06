import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AddCustomExerciseModal } from '@/components/profile/AddCustomExerciseModal'
import { AddDogModal } from '@/components/profile/AddDogModal'
import { CustomExercisesSection } from '@/components/profile/CustomExercisesSection'
import { DangerZone } from '@/components/profile/DangerZone'
import { DogInfoSection } from '@/components/profile/DogInfoSection'
import { DogSwitcher } from '@/components/profile/DogSwitcher'
import { SettingsSection } from '@/components/profile/SettingsSection'
import { useProfile } from '@/hooks/use-profile'
import { hasFeature, useSubscription } from '@/lib/billing/use-subscription'
import { useAuth } from '@/lib/auth/AuthContext'
import { colors, fontSize, space } from '@/theme/tokens'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { state, reload: reloadSub } = useSubscription()
  const isPro = hasFeature(state, 'custom_exercises')
  const canMultiDog = hasFeature(state, 'multiple_dogs')
  const {
    dog,
    allDogs,
    draft,
    setDraft,
    loading,
    saving,
    error,
    savedFlash,
    reload,
    save,
    switchDog,
  } = useProfile()

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [addDogOpen, setAddDogOpen] = useState(false)
  const [addExOpen, setAddExOpen] = useState(false)
  const [customKey, setCustomKey] = useState(0)

  useFocusEffect(
    useCallback(() => {
      void reload()
      void reloadSub()
    }, [reload, reloadSub]),
  )

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Tillbaka"
        >
          <Text style={styles.backLabel}>← Tillbaka</Text>
        </Pressable>
        <Text style={styles.title}>Profil</Text>
      </View>

      {loading && !draft ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          {dog ? (
            <DogInfoSection
              dog={dog}
              showSwitcher
              onOpenSwitcher={() => setSwitcherOpen(true)}
            />
          ) : (
            <Text style={styles.error}>Ingen hundprofil hittades.</Text>
          )}

          {draft ? (
            <SettingsSection draft={draft} onChange={setDraft} />
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {savedFlash ? <Text style={styles.saved}>Sparat</Text> : null}

          <Pressable
            style={[styles.saveBtn, saving && styles.saveDisabled]}
            disabled={saving || !draft}
            onPress={() => void save()}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveLabel}>Spara ändringar</Text>
            )}
          </Pressable>

          <CustomExercisesSection
            key={customKey}
            dogId={dog?.id}
            isPro={isPro}
            onAdd={() => setAddExOpen(true)}
          />

          {!canMultiDog ? (
            <Text style={styles.proHint}>Flera hundar ingår i Pro. Hantera via webbappen.</Text>
          ) : null}

          <DangerZone email={user?.email} />
        </ScrollView>
      )}

      <DogSwitcher
        visible={switcherOpen}
        dogs={allDogs}
        activeId={dog?.id}
        onClose={() => setSwitcherOpen(false)}
        onSelect={(id) => void switchDog(id)}
        canAdd={canMultiDog}
        onAdd={() => {
          setSwitcherOpen(false)
          setAddDogOpen(true)
        }}
      />

      <AddDogModal
        visible={addDogOpen}
        onClose={() => setAddDogOpen(false)}
        onCreated={() => void reload()}
      />

      {dog?.id ? (
        <AddCustomExerciseModal
          visible={addExOpen}
          dogId={dog.id}
          onClose={() => setAddExOpen(false)}
          onCreated={() => setCustomKey((k) => k + 1)}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space.xl, marginBottom: space.md },
  backBtn: { minHeight: 40, justifyContent: 'center', marginBottom: space.sm },
  backLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.base },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  content: { paddingHorizontal: space.xl },
  error: { color: colors.error, marginBottom: space.md },
  saved: { color: colors.primary, fontWeight: '600', marginBottom: space.sm },
  saveBtn: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  saveDisabled: { opacity: 0.6 },
  saveLabel: { color: '#fff', fontWeight: '600', fontSize: fontSize.base },
  proHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: space.lg,
    textAlign: 'center',
  },
})
