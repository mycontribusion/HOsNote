import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function TermsOfService() {
    const navigate = useNavigate()
    const location = useLocation()

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [])

    const handleBackToApp = () => {
        navigate('/team/my_team')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={handleBackToApp}
                        className="btn-ghost p-2 rounded-xl"
                        aria-label="Back to HOsNote"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate mx-4">Terms of Service</h1>
                    <div className="w-10" />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 pb-16">
                <article className="prose prose-gray dark:prose-invert max-w-none">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">HOsNote Terms of Service</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8"><strong>Last updated: September 25, 2026</strong></p>

                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        These Terms of Service govern your use of HOsNote, a clinical note-taking application for healthcare professionals. Please read these terms carefully before using HOsNote.
                    </p>

                    {/* Section 1 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of terms</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            By accessing or using HOsNote, you confirm that you have read, understood, and agree to be bound by these Terms of Service and any applicable laws and regulations.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            If you do not agree with any part of these terms, you must not use HOsNote. These terms apply to the entire application and any service, resource, or feature offered through HOsNote.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. About HOsNote</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote is a clinical note-taking application designed to help healthcare professionals create, organize, and manage clinical notes and related records.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote is a Progressive Web App (PWA) that runs in your web browser and is also available as a native Android application. The application is intended for use by healthcare professionals in clinical settings.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            HOsNote is not a medical device. HOsNote does not provide medical advice, diagnosis, or treatment. You should always follow your professional judgment and your healthcare facility's policies when using HOsNote.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Local storage and your responsibility</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote is designed to store your clinical data locally on your device using the browser's IndexedDB storage.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            The application does not require you to create a HOsNote account to use the local note-taking features. Your data remains on your device unless you choose to transfer it elsewhere, such as through Google Drive backup.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            You are responsible for backing up your data. HOsNote does not guarantee that your data will be preserved, and data loss is possible if your device is lost, damaged, or reset.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Google Drive backup and restore</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote provides an optional Google Drive backup and restore feature.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            If you choose to connect Google Drive, HOsNote uses Google's authentication services to authorize access to your Google Drive.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote requests the following Google Drive permission:
                        </p>
                        <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg mb-4 break-all">
                            <code>https://www.googleapis.com/auth/drive.file</code>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            This permission allows HOsNote to create and access files that HOsNote creates or that you explicitly make available to the application through Google Drive.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            HOsNote does not request unrestricted access to your entire Google Drive.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Google account authorization</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote uses Google's authentication services to allow you to connect your Google account.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote receives the authorization information necessary to communicate with Google Drive on your behalf.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote does not ask you to provide your Google password to the application.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            Google's own privacy policies and terms also apply to Google's processing of information through its services.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Your responsibility for clinical data</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote is a tool for clinical documentation. It does not determine whether information should be collected, stored, shared, or retained in a particular clinical setting.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You are responsible for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4 pl-4">
                            <li>Entering information accurately</li>
                            <li>Protecting access to your device</li>
                            <li>Protecting your Google account when Google Drive backup is enabled</li>
                            <li>Following applicable privacy and data-protection requirements</li>
                            <li>Following your healthcare facility's policies</li>
                            <li>Ensuring that you have appropriate authorization to store or back up patient information</li>
                        </ul>
                        <p className="text-gray-700 dark:text-gray-300">
                            Because HOsNote is intended for clinical documentation, information entered by you may contain sensitive or confidential patient information.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Backup limitations and possible data loss</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote does not guarantee that backups will succeed, that backups will be complete, or that your data will be preserved.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Backups may fail due to network issues, Google Drive storage limits, authentication problems, or other technical failures.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote's Google Drive backup is not end-to-end encrypted by HOsNote. The backup is stored in your Google Drive according to Google's security and privacy controls.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            You should maintain your own independent backups of any data you consider important. HOsNote is not liable for any data loss, whether or not Google Drive backup is enabled.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">8. No guarantee of uninterrupted availability</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote is provided on an "as is" and "as available" basis. HOsNote does not guarantee that the application will be uninterrupted, secure, or error-free.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            HOsNote may be modified, suspended, or discontinued at any time without notice. HOsNote is not liable for any interruption, suspension, or termination of your access to the application.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">9. Appropriate use</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You agree to use HOsNote only for lawful purposes and in accordance with these terms.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You must not use HOsNote in any way that could disable, overburden, or impair the application, or interfere with any other party's use of HOsNote.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            You are solely responsible for the content you enter into HOsNote and for ensuring that your use of HOsNote complies with applicable laws and professional obligations.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">10. Intellectual property</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote and its original content, features, and functionality are and will remain the exclusive property of the HOsNote developers.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote is licensed under the MIT License. You may use, copy, modify, and distribute HOsNote in accordance with the MIT License.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            These terms do not grant you any right, title, or interest in HOsNote, except for the limited license granted in the MIT License.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">11. Third-party services</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote may use technical services necessary to host, deliver, update, or operate the application.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Google services are used when you choose to use Google Drive authentication and backup.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            Third-party services may have their own terms and privacy policies governing information they process. HOsNote is not responsible for the practices of third-party services.
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">12. Relationship to Privacy Policy</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Your use of HOsNote is also governed by our <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            The Privacy Policy explains how HOsNote stores and handles information when you use the application, including when you choose to connect HOsNote to Google Drive for backup and restore.
                        </p>
                    </section>

                    {/* Section 13 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">13. Changes to the service and terms</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote may update these Terms of Service from time to time.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            When material changes are made, the updated terms will be published at this page with a new "Last updated" date. Your continued use of HOsNote after any changes constitutes your acceptance of the new terms.
                        </p>
                    </section>

                    {/* Section 14 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">14. Disclaimer and limitation of liability</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote is provided without any warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            In no event shall HOsNote, its developers, or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, revenue, or business, whether based on warranty, contract, tort, or any other legal theory, even if HOsNote has been advised of the possibility of such damages.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            HOsNote's total liability for any claim arising out of or related to these terms or the use of HOsNote will not exceed the amount you paid, if any, to use HOsNote. Since HOsNote is free to use, this means HOsNote's liability is limited to zero.
                        </p>
                    </section>

                    {/* Section 15 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">15. Termination and discontinuation</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            These terms remain in effect until terminated by you or HOsNote.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You may stop using HOsNote at any time by ceasing to access the application.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            HOsNote may, at its sole discretion, suspend or terminate or restrict your access to all or any part of HOsNote at any time, with or without cause, and with or without notice.
                        </p>
                    </section>

                    {/* Section 16 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">16. Governing law</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            These Terms of Service are governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            Any legal action or proceeding arising under these terms will be subject to the exclusive jurisdiction of the courts located in Nigeria.
                        </p>
                    </section>

                    {/* Section 17 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">17. Contact</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            If you have questions about these Terms of Service, please contact:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                            <p className="font-bold text-gray-900 dark:text-white">HOsNote</p>
                            <p className="mt-1">
                                Email: <a href="mailto:mycontribusion01@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">mycontribusion01@gmail.com</a>
                            </p>
                        </div>
                    </section>

                    {/* Footer acknowledgment */}
                    <hr className="border-gray-200 dark:border-gray-700 my-8" />
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                        By using HOsNote, you acknowledge that you have read and agree to these Terms of Service.
                    </p>
                </article>

                {/* Back to HOsNote button at bottom */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button
                        onClick={handleBackToApp}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to HOsNote
                    </button>
                </div>
            </main>
        </div>
    )
}
