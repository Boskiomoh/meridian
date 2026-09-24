<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, CircleAlert, ShieldCheck } from 'lucide-vue-next'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, useAuthStore } from '@/stores/auth'
import { ROLE_LABEL } from '@/lib/format'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/FormField.vue'
import AvatarMark from '@/components/AvatarMark.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const pendingRole = ref<string | null>(null)

async function go() {
  const next = typeof route.query.next === 'string' ? route.query.next : null
  await router.push(next ?? { name: 'directory' })
}

async function submit() {
  pendingRole.value = 'form'
  const ok = await auth.signIn(email.value.trim(), password.value)
  pendingRole.value = null
  if (ok) await go()
}

async function quickLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
  pendingRole.value = account.role
  const ok = await auth.signIn(account.email, DEMO_PASSWORD)
  pendingRole.value = null
  if (ok) await go()
}
</script>

<template>
  <div class="min-h-dvh bg-bg lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
    <!-- Identity side. Carries the thesis, because the evaluating visitor
         decides what this is before they decide to click anything. -->
    <section
      class="flex flex-col justify-between gap-10 border-b border-border bg-nav px-6 py-10 lg:border-b-0 lg:border-r lg:px-14 lg:py-14"
    >
      <div class="flex items-center gap-2.5">
        <span
          class="inline-flex size-7 items-center justify-center rounded-md bg-accent"
          aria-hidden="true"
        >
          <span class="block h-3 w-px bg-ink-invert" />
        </span>
        <span class="font-display text-lg font-semibold tracking-tight text-ink">Meridian</span>
      </div>

      <div class="max-w-md">
        <h1 class="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink">
          Every person, one clear line.
        </h1>
        <p class="mt-4 text-md leading-relaxed text-ink-soft">
          People operations for Northlane Studio — directory, leave, attendance and approvals,
          with every role boundary enforced in Postgres rather than hidden in the interface.
        </p>

        <div class="mt-8 flex gap-3 rounded-panel bg-surface p-4 ring-1 ring-inset ring-border">
          <ShieldCheck :size="17" :stroke-width="1.9" class="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          <p class="text-sm leading-relaxed text-ink-soft">
            Sign in as each role and watch what changes. An employee's session cannot read
            another employee's record — not because the screen hides it, but because the
            database refuses the row. The
            <span class="font-medium text-ink">Playwright and Postman suites</span>
            in this repo assert exactly that.
          </p>
        </div>
      </div>

      <p class="text-xs text-ink-faint">
        Northlane Studio is fictional. All records are generated demo data.
      </p>
    </section>

    <!-- Action side. -->
    <section class="flex items-center px-6 py-10 lg:px-14 lg:py-14">
      <div class="mx-auto w-full max-w-md">
        <h2 class="font-display text-xl font-semibold tracking-tight text-ink">
          Choose a role to explore
        </h2>
        <p class="mt-1.5 text-sm text-ink-soft">
          One click signs you in. No credentials to type.
        </p>

        <ul class="mt-6 flex flex-col gap-2.5">
          <li v-for="account in DEMO_ACCOUNTS" :key="account.role">
            <button
              class="group flex w-full items-center gap-3.5 rounded-panel bg-surface p-3.5 text-left ring-1 ring-inset ring-border transition-[box-shadow,border-color,transform] duration-150 hover:shadow-raise hover:ring-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
              :disabled="pendingRole !== null"
              @click="quickLogin(account)"
            >
              <AvatarMark :name="account.name" size="lg" />
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="font-display text-md font-semibold text-ink">{{ account.name }}</span>
                  <span
                    class="rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-medium text-accent-ink"
                  >
                    {{ ROLE_LABEL[account.role] }}
                  </span>
                </span>
                <span class="mt-0.5 block text-xs text-ink-faint">{{ account.title }}</span>
                <span class="mt-1 block text-sm leading-snug text-ink-soft">{{ account.blurb }}</span>
              </span>
              <ArrowRight
                :size="17"
                :stroke-width="1.9"
                class="shrink-0 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>

        <div class="my-7 flex items-center gap-3">
          <span class="h-px flex-1 bg-border" />
          <span class="text-2xs uppercase tracking-[0.13em] text-ink-faint">or sign in</span>
          <span class="h-px flex-1 bg-border" />
        </div>

        <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
          <FormField v-slot="{ id, describedBy }" label="Work email" required>
            <input
              :id="id"
              v-model="email"
              :aria-describedby="describedBy"
              type="email"
              autocomplete="username"
              class="field-input"
              placeholder="name@northlane.studio"
            />
          </FormField>

          <FormField v-slot="{ id, describedBy }" label="Password" required>
            <input
              :id="id"
              v-model="password"
              :aria-describedby="describedBy"
              type="password"
              autocomplete="current-password"
              class="field-input"
              placeholder="Your password"
            />
          </FormField>

          <p
            v-if="auth.error"
            class="flex items-start gap-2 rounded-[6px] bg-danger-soft px-3 py-2.5 text-sm text-[#87291f]"
            role="alert"
          >
            <CircleAlert :size="15" :stroke-width="2.1" class="mt-0.5 shrink-0" aria-hidden="true" />
            {{ auth.error }}
          </p>

          <AppButton
            type="submit"
            variant="primary"
            block
            :loading="pendingRole === 'form'"
            :disabled="!email || !password || pendingRole !== null"
          >
            Sign in
          </AppButton>
        </form>
      </div>
    </section>
  </div>
</template>
