import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Markdown from 'react-native-markdown-display'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useChat, type UiChatMessage } from '@/hooks/use-chat'
import { colors, fontSize, space } from '@/theme/tokens'

function MessageBubble({
  message,
  onRetry,
}: {
  message: UiChatMessage
  onRetry: (q: string) => void
}) {
  const isUser = message.role === 'user'
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowModel]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleModel,
          message.isError && styles.bubbleError,
        ]}
      >
        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          <Markdown style={markdownStyles}>{message.content}</Markdown>
        )}
        {message.sources?.length ? (
          <View style={styles.sources}>
            {message.sources.slice(0, 3).map((s, i) => (
              <Pressable
                key={`${s.source}-${i}`}
                onPress={() => {
                  if (s.source_url) void Linking.openURL(s.source_url)
                }}
              >
                <Text style={styles.sourceLink}>
                  {s.source_url ? `↗ ${s.source}` : s.source}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {message.attributionNote ? (
          <Text style={styles.attr}>{message.attributionNote}</Text>
        ) : null}
        {message.isError && message.retryable && message.retryQuery ? (
          <Pressable
            style={styles.retry}
            onPress={() => onRetry(message.retryQuery!)}
            accessibilityRole="button"
          >
            <Text style={styles.retryLabel}>Försök igen</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const { dog, messages, loading, booting, errorBanner, send, retry } = useChat()
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList<UiChatMessage>>(null)

  const week = dog?.trainingWeek ?? 1
  const quickPrompts = [
    `Ge mig en plan för nästa 5 reps i programvecka ${week}.`,
    'Hur långt pass ska vi köra idag?',
    'Vi fastnar på sitt — hur backar jag kriteriet?',
  ]

  useEffect(() => {
    if (messages.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
    }
  }, [messages, loading])

  async function onSend(text?: string) {
    const q = (text ?? input).trim()
    if (!q) return
    setInput('')
    await send(q)
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + space.sm }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <Text style={styles.title}>Chatt</Text>
      {errorBanner ? <Text style={styles.banner}>{errorBanner}</Text> : null}

      {booting ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <MessageBubble message={item} onRetry={retry} />}
          ListFooterComponent={
            loading ? (
              <View style={styles.typing}>
                <Text style={styles.typingText}>…</Text>
              </View>
            ) : null
          }
        />
      )}

      {!booting && messages.length <= 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prompts}>
          {quickPrompts.map((q) => (
            <Pressable key={q} style={styles.promptChip} onPress={() => void onSend(q)}>
              <Text style={styles.promptLabel} numberOfLines={2}>
                {q}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Skriv din fråga…"
          placeholderTextColor={colors.textMuted}
          editable={!loading}
          multiline
        />
        <Pressable
          style={[styles.send, (!input.trim() || loading) && styles.sendDisabled]}
          disabled={!input.trim() || loading}
          onPress={() => void onSend()}
          accessibilityRole="button"
          accessibilityLabel="Skicka"
        >
          <Text style={styles.sendLabel}>Skicka</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const markdownStyles = {
  body: { color: colors.text, fontSize: fontSize.base },
  paragraph: { marginTop: 0, marginBottom: space.sm },
  bullet_list: { marginBottom: space.sm },
  strong: { fontWeight: '600' as const },
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: space.xl,
    marginBottom: space.sm,
  },
  banner: {
    marginHorizontal: space.xl,
    marginBottom: space.sm,
    color: colors.error,
    fontSize: fontSize.sm,
  },
  list: { paddingHorizontal: space.xl, paddingBottom: space.lg },
  row: { marginBottom: space.md },
  rowUser: { alignItems: 'flex-end' },
  rowModel: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '92%',
    borderRadius: 16,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  bubbleUser: { backgroundColor: colors.primary },
  bubbleModel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleError: { borderColor: colors.error, backgroundColor: '#fff5f5' },
  userText: { color: colors.surface, fontSize: fontSize.base },
  sources: { marginTop: space.sm, gap: space.xs },
  sourceLink: { color: colors.primary, fontSize: fontSize.sm },
  attr: { marginTop: space.xs, fontSize: fontSize.xs, color: colors.textMuted },
  retry: {
    marginTop: space.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryLabel: { color: colors.primary, fontWeight: '600' },
  typing: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  typingText: { color: colors.textMuted, fontSize: fontSize.lg },
  prompts: { maxHeight: 72, paddingHorizontal: space.xl, marginBottom: space.sm },
  promptChip: {
    maxWidth: 220,
    marginRight: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  promptLabel: { fontSize: fontSize.xs, color: colors.text },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: colors.text,
    fontSize: fontSize.base,
    backgroundColor: colors.bg,
  },
  send: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
  sendLabel: { color: colors.surface, fontWeight: '600' },
})
