import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import {
  BookOpen,
  Check,
  LinkedinLogo,
  TwitterLogo,
  Spinner,
} from 'phosphor-react'
import * as Dialog from '@radix-ui/react-dialog'

import { trpc } from '~/utils/trpc'
import { trpcSSG } from '~/server/trpc-ssg'
import ResultChart from '~/components/ResultChart'
import { getBaseUrl } from '~/utils/get-base-url'
import { getLevelFromResult } from '~/utils/get-level-from-result'
import { useForm } from 'react-hook-form'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '~/contexts/ToastProvider'
import { useState } from 'react'

const SendResultFormSchema = z.object({
  email: z.string().email('Email inválido'),
})

type SendResultFormData = z.infer<typeof SendResultFormSchema>

export default function Results() {
  const router = useRouter()
  const { addToast } = useToast()
  const submissionId = String(router.query.id)
  const [isSendReportModalOpen, setIsSendReportModalOpen] = useState(false)

  const {
    mutateAsync: sendReport,
    isLoading: isSendingReport,
    data: sendReportResult,
  } = trpc.useMutation('report.sendReport')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SendResultFormData>({
    resolver: zodResolver(SendResultFormSchema),
  })

  async function handleSendResultToUserEmail({ email }: SendResultFormData) {
    await sendReport({ submissionId, email })

    setIsSendReportModalOpen(false)
    addToast({
      title: 'Relatório enviado com sucesso',
      type: 'success',
    })
  }

  const response = trpc.useQuery([
    'submissionSession.result',
    {
      submissionId,
    },
  ])

  const result = response.data!

  const level = getLevelFromResult(result.result)

  const shareMessage = encodeURIComponent(
    `Acabei de completar o quiz de ${result.quiz?.title} da Rocketseat com um nível ${level}. Clique aqui para testar seus conhecimentos!`,
  )

  const shareUrl = `${getBaseUrl()}/quizzes/${result.quiz?.slug}`

  return (
    <>
      <NextSeo title={`Resultado: ${result.quiz?.title}`} />

      <div className="mx-auto h-screen text-center flex flex-col items-stretch justify-center max-w-lg py-6 px-4">
        <div className="flex items-center justify-center flex-col">
          <ResultChart score={result.result} />
        </div>

        <h1 className="text-2xl font-bold">
          {result.quiz?.title}:{' '}
          <span className="text-emerald-500">{level}</span>
        </h1>

        <p className="text-md text-zinc-400 mt-2">
          Seu nível está acima de{' '}
          <span className="font-bold">{result.betterThanPercentage}%</span> dos
          outros usuários
        </p>

        <Dialog.Root
          open={isSendReportModalOpen}
          onOpenChange={setIsSendReportModalOpen}
        >
          <Dialog.Trigger
            type="button"
            className="mt-6 inline-flex gap-2 justify-center items-center rounded-md border border-transparent bg-violet-600 py-3 px-8 text-md font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            <BookOpen className="w-5 h-5" weight="bold" />
            Visualizar relatório completo
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-30 bg-black/60" />

            <Dialog.Content className="bg-zinc-800 z-40 rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed p-6 w-full max-w-sm">
              <Dialog.Title className="text-2xl font-bold">
                Deixe seu e-mail e...
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-zinc-300">
                <ul className="mt-2 leading-relaxed">
                  <li className="inline-flex gap-2 items-center">
                    <Check className="w-4 h-4 text-emerald-300" />
                    Receba o gabarito do questionário;
                  </li>
                  <li className="inline-flex gap-2 items-center">
                    <Check className="w-4 h-4 text-emerald-300" />
                    Salve seu progresso para o futuro;
                  </li>
                  <li className="inline-flex gap-2 items-center">
                    <Check className="w-4 h-4 text-emerald-300" />
                    Receba dicas para melhorar suas skills.
                  </li>
                </ul>
              </Dialog.Description>

              <form
                onSubmit={handleSubmit(handleSendResultToUserEmail)}
                noValidate={true}
                className="pt-4 mt-4 border-t border-t-zinc-700"
              >
                <input
                  type="email"
                  placeholder="Deixe seu melhor e-mail"
                  className={`bg-zinc-900 px-3 py-3 rounded block mt-1 w-full border disabled:opacity-50  ${
                    errors?.email ? 'border-red-500' : 'border-zinc-900'
                  }`}
                  required
                  disabled={sendReportResult?.success === true}
                  {...register('email')}
                />

                {errors?.email && (
                  <p className="text-red-500 text-xs italic mt-2">
                    {errors.email.message}
                  </p>
                )}

                <button
                  type="submit"
                  className="mt-6 flex w-full gap-2 justify-center items-center rounded-md border border-transparent bg-violet-600 py-3 px-8 text-md font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSendingReport || sendReportResult?.success}
                >
                  {isSendingReport ? (
                    <Spinner className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5" weight="bold" />
                      Receber relatório
                    </>
                  )}
                </button>

                <Dialog.Trigger
                  type="button"
                  className="mt-2 flex w-full gap-2 justify-center items-center rounded-md border border-transparent py-3 px-8 text-md font-medium text-zinc-300 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                >
                  Cancelar
                </Dialog.Trigger>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="relative my-6 mx-12">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-zinc-900 text-sm text-zinc-500">
              Compartilhe
            </span>
          </div>
        </div>

        <div className="inline space-x-4 text-md text-gray-500">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
            className="text-zinc-400 hover:text-violet-300"
          >
            <span className="sr-only">Instagram</span>
            <LinkedinLogo className="h-6 w-6 inline" />
          </a>
          <a
            href={`http://twitter.com/share?text=${shareMessage}&url=${shareUrl}`}
            className="text-zinc-400 hover:text-violet-300"
          >
            <span className="sr-only">Twitter</span>
            <TwitterLogo className="h-6 w-6 inline" />
          </a>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const submissionId = params?.id as string

  await trpcSSG.prefetchQuery('submissionSession.result', { submissionId })

  return {
    props: {
      trpcState: trpcSSG.dehydrate(),
    },
  }
}
