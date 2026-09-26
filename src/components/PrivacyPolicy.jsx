import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function PrivacyPolicy() {
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
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate mx-4">Privacy Policy</h1>
                    <div className="w-10" />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 pb-16">
                <article className="prose prose-gray dark:prose-invert max-w-none">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">HOsNote Privacy Policy</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8"><strong>Last updated: September 25, 2026</strong></p>

                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        HOsNote is a clinical note-taking application designed to help healthcare professionals create, organize, and manage clinical notes and related records.
                    </p>

                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        This Privacy Policy explains how HOsNote stores and handles information when you use the application, including when you choose to connect HOsNote to Google Drive for backup and restore.
                    </p>

                    {/* Section 1 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Information stored in HOsNote</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote allows you to store information that you enter into the application, which may include:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4 pl-4">
                            <li>Patient notes and clinical documentation</li>
                            <li>Patient identifiers and hospital numbers entered by you</li>
                            <li>Discharge records</li>
                            <li>Mortality records</li>
                            <li>Drafts and discarded drafts</li>
                            <li>Documents or scanned records added to the application</li>
                            <li>Other information you choose to enter or save in HOsNote</li>
                        </ul>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Because HOsNote is intended for clinical documentation, information entered by you may contain sensitive or confidential patient information.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            You are responsible for ensuring that your use of HOsNote complies with applicable laws, professional obligations, and the policies of your healthcare facility or organization.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Local storage</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote is designed to store your clinical data locally on your device.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            The application uses the device's local browser/application storage to save your records so that you can access them without requiring a HOsNote account or a HOsNote cloud server.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            HOsNote does not require you to create a HOsNote account to use the application's local note-taking features.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. HOsNote does not operate a clinical-data server</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote does not operate a backend server that receives and stores your clinical notes as part of the normal local note-taking functionality.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            Your locally stored clinical information remains on your device unless you choose a feature that transfers it elsewhere, such as Google Drive backup.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Google Drive backup</h2>
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Automatic backup</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            When Google Drive is connected, HOsNote can automatically back up changes to your HOsNote data.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Automatic backup occurs only after you have connected Google Drive and authorized HOsNote.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Your local data is saved on the device independently of whether an automatic backup succeeds.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            If the device is offline or a backup fails, HOsNote does not delete your local clinical data because of the failed backup. The application may attempt the backup again when the appropriate conditions are available.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            You can also initiate a backup manually using the <strong>Back Up Now</strong> feature.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. What is sent to Google Drive</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            When a backup is created, HOsNote prepares a backup containing the HOsNote data necessary to restore your local records.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            That backup is uploaded to your Google Drive using Google's Drive services.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            The backup may therefore contain sensitive information that you previously entered into HOsNote, including patient or clinical information.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            You should only enable Google Drive backup if you are permitted to store such information using the relevant Google account and Google Drive environment.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Google authentication</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote uses Google's authentication services to allow you to connect your Google account.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote receives the authorization information necessary to communicate with Google Drive on your behalf.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote does not ask you to provide your Google password to the application.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Google's own privacy policies and terms also apply to Google's processing of information through its services.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            For more information about Google's handling of information, please refer to Google's privacy documentation.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">8. Access tokens and connection status</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            When you connect Google Drive, HOsNote uses an authorization token supplied through Google's authentication system to perform permitted Google Drive operations.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote does not store your Google account password.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You can disconnect Google Drive from HOsNote at any time using the <strong>Disconnect</strong> option.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            Disconnecting prevents HOsNote from continuing to use the existing Google Drive connection from that device. Backups already stored in Google Drive are not automatically deleted simply because you disconnect HOsNote.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">9. Google Drive security</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Google Drive provides its own security and account-access controls.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            However, HOsNote's Google Drive backup is <strong>not end-to-end encrypted by HOsNote</strong>.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            This means that the backup should not be described as an end-to-end encrypted backup. Access to the Google account or Google Drive containing the backup may provide access to the stored backup according to the permissions and security controls associated with that account.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            You should protect your Google account and device appropriately, including using Google's available account-security features.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">10. Data deletion</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote does not automatically delete your Google Drive backups when you disconnect the application.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You can manage and delete HOsNote backup files from your Google Drive according to Google's available Drive controls.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Deleting local HOsNote data from your device does not necessarily delete a backup that has already been uploaded to Google Drive.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            Similarly, deleting a Google Drive backup does not necessarily delete information that remains stored locally in HOsNote.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">11. Data sharing</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote does not sell your clinical information.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote does not use your clinical notes for advertising.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            When you use Google Drive backup, your selected data is transmitted to and stored by Google Drive as necessary to provide the backup and restore functionality.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            HOsNote does not intentionally share your clinical notes with unrelated third parties.
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">12. Analytics and third-party services</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote may use technical services necessary to host, deliver, update, or operate the application.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            The HOsNote clinical-note functionality does not require you to create a HOsNote account.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Google services are used when you choose to use Google Drive authentication and backup.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            Third-party services may have their own privacy policies and terms governing information they process.
                        </p>
                    </section>

                    {/* Section 13 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">13. Children's privacy</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            HOsNote is intended for healthcare professionals and is not directed toward children.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            HOsNote does not knowingly collect personal information from children for the purpose of creating HOsNote accounts.
                        </p>
                    </section>

                    {/* Section 14 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">14. Your responsibility when handling patient information</h2>
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
                    </section>

                    {/* Section 15 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">15. Changes to this Privacy Policy</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            This Privacy Policy may be updated when HOsNote's features, services, or data-handling practices change.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            When material changes are made, the updated policy will be published at this page with a new "Last updated" date.
                        </p>
                    </section>

                    {/* Section 16 */}
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">16. Contact</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            If you have questions about this Privacy Policy or HOsNote's handling of information, please contact:
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
                        By using HOsNote, you acknowledge that you have read this Privacy Policy.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mt-4">
                        For the full terms governing your use of HOsNote, see our <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a>.
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