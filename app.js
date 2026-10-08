/**
 * Arogyadham Swasthya Kutir - Official Taj Hotels Experience
 * Complete Modular Application Logic
 */

// Application State
const tajState = {
  selectedRoom: 'Mandakini Royal Suite',
  selectedRate: 12000,
  checkIn: '2026-10-18',
  checkOut: '2026-10-19',
  nights: 1,
  discountPercent: 0,
  promoCode: '',
};

document.addEventListener('DOMContentLoaded', () => {
  tajAuth.init();
  initTajNavbarScroll();
  initReservationDrawer();
  initCopyAddress();
  initSearchInput();
  initRouting();
  initDiningMenu();
  initRasoeeMenu();
});

function initRasoeeMenu() {
  renderPasoeeItems();
  updatePasoeeCartUI();
}
const initPasoeeMenu = initRasoeeMenu;

/* ================= REAL FIREBASE AUTHENTICATION & STATE MANAGEMENT ================= */
const tajAuth = {
  currentUser: null,
  pendingBooking: null,
  firestoreBookings: [],
  unsubscribeBookings: null,

  init() {
    this.updateUI();
    this.setupDropdownCloser();

    // Bind with TajFirebase module once loaded
    if (window.TajFirebase) {
      this.bindFirebase(window.TajFirebase);
    } else {
      window.onTajFirebaseReady = () => {
        if (window.TajFirebase) {
          this.bindFirebase(window.TajFirebase);
        }
      };
    }
  },

  bindFirebase(firebaseInstance) {
    if (!firebaseInstance) return;

    firebaseInstance.onAuthChange((user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'Guest'),
          email: user.email || '',
          photoURL: user.photoURL || null,
          emailVerified: !!user.emailVerified,
          verified: !!user.emailVerified,
        };

        console.log('✓ Firebase Auth State: Logged In as', this.currentUser.email, '(Verified:', this.currentUser.emailVerified, ')');

        // Subscribe to real-time Cloud Firestore bookings
        if (this.unsubscribeBookings) {
          this.unsubscribeBookings();
        }

        this.unsubscribeBookings = firebaseInstance.subscribeToBookings(user.uid, (bookings) => {
          this.firestoreBookings = bookings || [];
          this.updateUI();

          // If My Bookings modal is open, re-render dynamically
          const modal = document.getElementById('my-bookings-modal');
          if (modal && !modal.classList.contains('hidden-modal')) {
            openMyBookingsModal();
          }
        });

        // If user is verified and has an intended booking in sessionStorage, auto-resume
        if (this.currentUser.emailVerified) {
          this.checkAndResumeIntendedBooking();
        }
      } else {
        console.log('✓ Firebase Auth State: Logged Out');
        this.currentUser = null;
        this.firestoreBookings = [];
        if (this.unsubscribeBookings) {
          this.unsubscribeBookings();
          this.unsubscribeBookings = null;
        }
      }

      this.updateUI();
    });
  },

  isLoggedIn() {
    return !!(this.currentUser && this.currentUser.emailVerified);
  },

  getUser() {
    return this.currentUser;
  },

  getInitials(name) {
    if (!name) return 'VY';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },

  getBookings() {
    if (this.firestoreBookings && this.firestoreBookings.length > 0) {
      return this.firestoreBookings;
    }
    try {
      const data = localStorage.getItem('ask_user_bookings');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addBooking(bookingObj) {
    // Add locally immediately while Firestore listener syncs
    this.firestoreBookings.unshift(bookingObj);
    try {
      const existing = this.getBookings();
      existing.unshift(bookingObj);
      localStorage.setItem('ask_user_bookings', JSON.stringify(existing));
    } catch (e) {}
    this.updateUI();
  },

  updateUI() {
    const isAuth = !!this.currentUser;
    const isVerified = isAuth && this.currentUser.emailVerified;
    const user = this.currentUser || {};
    const initials = this.getInitials(user.name || 'Member');

    // Desktop Navbar Elements
    const navLoginBtn = document.getElementById('nav-login-btn');
    const navUserDropdown = document.getElementById('nav-user-dropdown');
    const navUserPhoto = document.getElementById('nav-user-photo');
    const navUserInitials = document.getElementById('nav-user-initials');
    const navUserName = document.getElementById('nav-user-name');
    const dropdownFullName = document.getElementById('dropdown-user-fullname');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    const dropdownPhone = document.getElementById('dropdown-user-phone');
    const dropdownBadge = document.getElementById('dropdown-user-badge');
    const bookingsCountBadge = document.getElementById('nav-bookings-count');

    // Mobile Navbar Elements
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileUserBar = document.getElementById('mobile-user-profile-bar');
    const mobileUserPhoto = document.getElementById('mobile-user-photo');
    const mobileUserInitials = document.getElementById('mobile-user-initials');
    const mobileUserName = document.getElementById('mobile-user-name');
    const mobileUserBadge = document.getElementById('mobile-user-badge');

    // Drawer User Badge
    const drawerBadge = document.getElementById('drawer-user-badge');
    const drawerBadgeName = document.getElementById('drawer-user-badge-name');
    const drawerBadgeEmail = document.getElementById('drawer-user-badge-email');

    const bookings = this.getBookings();
    if (bookingsCountBadge) {
      bookingsCountBadge.textContent = bookings.length;
    }

    if (isAuth) {
      // Desktop
      if (navLoginBtn) navLoginBtn.classList.add('hidden');
      if (navUserDropdown) navUserDropdown.classList.remove('hidden');

      if (user.photoURL && navUserPhoto) {
        navUserPhoto.src = user.photoURL;
        navUserPhoto.classList.remove('hidden');
        if (navUserInitials) navUserInitials.classList.add('hidden');
      } else {
        if (navUserPhoto) navUserPhoto.classList.add('hidden');
        if (navUserInitials) {
          navUserInitials.textContent = initials;
          navUserInitials.classList.remove('hidden');
        }
      }

      if (navUserName) navUserName.textContent = user.name || 'Member';
      if (dropdownFullName) dropdownFullName.textContent = user.name || 'Member';
      if (dropdownEmail) dropdownEmail.textContent = user.email || '';
      if (dropdownPhone) dropdownPhone.textContent = user.phone || 'Firebase Account';

      if (dropdownBadge) {
        if (isVerified) {
          dropdownBadge.textContent = '✓ Verified';
          dropdownBadge.className = 'text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold border border-emerald-300';
        } else {
          dropdownBadge.textContent = '⚠️ Unverified';
          dropdownBadge.className = 'text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold border border-amber-300';
        }
      }

      // Mobile
      if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
      if (mobileUserBar) mobileUserBar.classList.remove('hidden');

      if (user.photoURL && mobileUserPhoto) {
        mobileUserPhoto.src = user.photoURL;
        mobileUserPhoto.classList.remove('hidden');
        if (mobileUserInitials) mobileUserInitials.classList.add('hidden');
      } else {
        if (mobileUserPhoto) mobileUserPhoto.classList.add('hidden');
        if (mobileUserInitials) {
          mobileUserInitials.textContent = initials;
          mobileUserInitials.classList.remove('hidden');
        }
      }

      if (mobileUserName) mobileUserName.textContent = user.name || 'Member';
      if (mobileUserBadge) {
        mobileUserBadge.textContent = isVerified ? '✓ Verified Member' : '⚠️ Email Unverified';
        mobileUserBadge.className = isVerified ? 'text-[9px] text-emerald-700 font-semibold' : 'text-[9px] text-amber-700 font-semibold';
      }

      // Drawer badge
      if (drawerBadge) drawerBadge.classList.remove('hidden');
      if (drawerBadgeName) drawerBadgeName.textContent = user.name || 'Member';
      if (drawerBadgeEmail) drawerBadgeEmail.textContent = user.email || '';
    } else {
      // Logged Out
      if (navLoginBtn) navLoginBtn.classList.remove('hidden');
      if (navUserDropdown) navUserDropdown.classList.add('hidden');

      if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');
      if (mobileUserBar) mobileUserBar.classList.add('hidden');

      if (drawerBadge) drawerBadge.classList.add('hidden');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  checkAndResumeIntendedBooking() {
    const intendedStr = sessionStorage.getItem('ask_intended_booking');
    if (!intendedStr) return;

    try {
      const intended = JSON.parse(intendedStr);
      sessionStorage.removeItem('ask_intended_booking');
      this.pendingBooking = null;

      showTajToast(
        'Resuming Booking',
        `Welcome! Proceeding with your sanctuary reservation for "${intended.roomName}"...`,
        'check'
      );

      setTimeout(() => {
        openBookingDrawer(intended.roomName, intended.rate);
      }, 350);
    } catch (e) {
      sessionStorage.removeItem('ask_intended_booking');
    }
  },

  setupDropdownCloser() {
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('user-menu-dropdown');
      const userBtn = document.getElementById('nav-user-btn');
      if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(e.target) && (!userBtn || !userBtn.contains(e.target))) {
          dropdown.classList.add('hidden');
        }
      }
    });
  },

  logout() {
    if (this.unsubscribeBookings) {
      this.unsubscribeBookings();
      this.unsubscribeBookings = null;
    }
    this.currentUser = null;
    this.firestoreBookings = [];
    this.updateUI();
    showTajToast('Logged Out', 'You have been safely signed out from Arogyadham Swasthya Kutir.', 'log-out');
  }
};
window.tajAuth = tajAuth;

/* ================= AUTHENTICATION MODAL CONTROLLERS ================= */
function openAuthModal(tab = 'signin', guardMessage = null) {
  const modal = document.getElementById('auth-modal');
  const guardAlert = document.getElementById('auth-guard-alert');
  const guardMsg = document.getElementById('auth-guard-msg');

  if (guardMessage) {
    if (guardAlert) guardAlert.classList.remove('hidden');
    if (guardMsg) guardMsg.textContent = guardMessage;
  } else {
    if (guardAlert) guardAlert.classList.add('hidden');
  }

  switchAuthTab(tab);

  if (modal) {
    modal.classList.remove('hidden-modal');
    modal.classList.add('show-modal');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('hidden-modal');
    modal.classList.remove('show-modal');
  }
}

function switchAuthTab(tab) {
  const signinBtn = document.getElementById('auth-tab-btn-signin');
  const signupBtn = document.getElementById('auth-tab-btn-signup');
  const signinForm = document.getElementById('auth-signin-form');
  const signupForm = document.getElementById('auth-signup-form');
  const verifyStep = document.getElementById('auth-verify-step');
  const socialSection = document.getElementById('auth-social-section');
  const tabsHeader = document.getElementById('auth-tabs-header');

  if (verifyStep) verifyStep.classList.add('hidden');
  if (socialSection) socialSection.classList.remove('hidden');
  if (tabsHeader) tabsHeader.classList.remove('hidden');

  if (tab === 'signin') {
    if (signinBtn) {
      signinBtn.className = 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 border-taj-gold text-taj-gold transition-all';
    }
    if (signupBtn) {
      signupBtn.className = 'flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider text-center border-b-2 border-transparent text-taj-muted hover:text-taj-charcoal transition-all';
    }
    if (signinForm) signinForm.classList.remove('hidden');
    if (signupForm) signupForm.classList.add('hidden');
  } else {
    if (signupBtn) {
      signupBtn.className = 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 border-taj-gold text-taj-gold transition-all';
    }
    if (signinBtn) {
      signinBtn.className = 'flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider text-center border-b-2 border-transparent text-taj-muted hover:text-taj-charcoal transition-all';
    }
    if (signinForm) signinForm.classList.add('hidden');
    if (signupForm) signupForm.classList.remove('hidden');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

async function forgotPasswordNotice() {
  const email = prompt('Please enter your email to receive a password reset link:');
  if (email && email.includes('@')) {
    try {
      if (window.TajFirebase) {
        await window.TajFirebase.resetPassword(email);
        showTajToast('Reset Email Sent', `Password reset instructions dispatched to ${email}.`, 'mail');
      }
    } catch (e) {
      showTajToast('Reset Request', e.message || 'Please check the email provided.', 'alert-circle');
    }
  }
}

/* ================= REAL FIREBASE GOOGLE OAUTH ================= */
async function handleGoogleSignIn() {
  try {
    if (!window.TajFirebase) {
      throw new Error('Firebase SDK is loading, please try again in a moment');
    }
    showTajToast('Google Authentication', 'Opening Google Sign-In selector...', 'loader');
    const user = await window.TajFirebase.signInWithGoogle();

    closeAuthModal();
    showTajToast(
      'Signed In with Google',
      `Welcome to Arogyadham, ${user.displayName || 'Guest'}!`,
      'check-circle'
    );

    resumePendingBooking();
  } catch (err) {
    console.warn('Google Sign-In Error:', err);
    if (err.code !== 'auth/popup-closed-by-user') {
      showTajToast('Google Sign-In', err.message || 'Authentication could not be completed.', 'alert-circle');
    }
  }
}

/* ================= REAL FIREBASE EMAIL SIGN-IN ================= */
async function handleEmailSignIn(event) {
  event.preventDefault();
  const emailInput = document.getElementById('signin-email');
  const passwordInput = document.getElementById('signin-password');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    showTajToast('Missing Fields', 'Please enter your email and password.', 'alert-circle');
    return;
  }

  try {
    showTajToast('Authenticating', 'Signing in with Firebase...', 'loader');
    const user = await window.TajFirebase.signInWithEmail(email, password);

    if (!user.emailVerified) {
      closeAuthModal();
      openEmailVerificationGuardModal(user.email);
      showTajToast(
        'Email Unverified',
        'Please verify your email via the link sent to your inbox before proceeding with bookings.',
        'alert-triangle'
      );
      return;
    }

    closeAuthModal();
    showTajToast(
      'Signed In Successfully',
      `Welcome to Arogyadham Swasthya Kutir, ${user.displayName || user.email.split('@')[0]}!`,
      'crown'
    );

    resumePendingBooking();
  } catch (err) {
    console.error('Email sign in error:', err);
    let errorMsg = 'Invalid email or password.';
    if (err.code === 'auth/user-not-found') errorMsg = 'No account found with this email. Please sign up.';
    if (err.code === 'auth/wrong-password') errorMsg = 'Incorrect password. Please try again.';
    if (err.code === 'auth/invalid-credential') errorMsg = 'Invalid credentials. Please verify your email and password.';
    showTajToast('Sign-In Failed', errorMsg, 'alert-circle');
  }
}

/* ================= REAL FIREBASE EMAIL SIGN-UP & VERIFICATION ================= */
async function handleEmailSignUp(event) {
  event.preventDefault();
  const name = document.getElementById('signup-fullname').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if (password.length < 6) {
    showTajToast('Password Length', 'Password must be at least 6 characters.', 'alert-circle');
    return;
  }

  try {
    showTajToast('Creating Account', 'Registering profile and sending verification link...', 'loader');
    const user = await window.TajFirebase.signUpWithEmail(name, phone, email, password);

    // Show Email Verification Step
    const signinForm = document.getElementById('auth-signin-form');
    const signupForm = document.getElementById('auth-signup-form');
    const verifyStep = document.getElementById('auth-verify-step');
    const socialSection = document.getElementById('auth-social-section');
    const tabsHeader = document.getElementById('auth-tabs-header');
    const targetEmail = document.getElementById('verify-target-email');

    if (signinForm) signinForm.classList.add('hidden');
    if (signupForm) signupForm.classList.add('hidden');
    if (socialSection) socialSection.classList.add('hidden');
    if (tabsHeader) tabsHeader.classList.add('hidden');
    if (verifyStep) verifyStep.classList.remove('hidden');
    if (targetEmail) targetEmail.textContent = email;

    showTajToast(
      'Verification Link Sent',
      'Please verify your email via the link sent to your inbox before proceeding with bookings.',
      'mail'
    );
  } catch (err) {
    console.error('Signup error:', err);
    let msg = err.message || 'Could not complete registration.';
    if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists. Please Sign In.';
    if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
    showTajToast('Registration Failed', msg, 'alert-circle');
  }
}

/* ================= EMAIL VERIFICATION CHECK & RESEND ================= */
function openEmailVerificationGuardModal(email) {
  const modal = document.getElementById('email-verification-guard-modal');
  const emailEl = document.getElementById('guard-modal-email');
  if (emailEl && email) emailEl.textContent = email;
  if (modal) {
    modal.classList.remove('hidden-modal');
    modal.classList.add('show-modal');
  }
}

function closeEmailVerificationGuardModal() {
  const modal = document.getElementById('email-verification-guard-modal');
  if (modal) {
    modal.classList.add('hidden-modal');
    modal.classList.remove('show-modal');
  }
}

async function handleCheckEmailVerification() {
  try {
    showTajToast('Checking Status', 'Reloading email verification state...', 'loader');
    if (!window.TajFirebase) return;
    const reloaded = await window.TajFirebase.reloadUser();

    if (reloaded && reloaded.emailVerified) {
      closeEmailVerificationGuardModal();
      closeAuthModal();
      tajAuth.currentUser.emailVerified = true;
      tajAuth.currentUser.verified = true;
      tajAuth.updateUI();

      showTajToast('Email Verified!', 'Your account is verified. Resuming your reservation...', 'check-circle');
      resumePendingBooking();
    } else {
      showTajToast(
        'Not Yet Verified',
        'Please verify your email via the link sent to your inbox before proceeding with bookings.',
        'alert-triangle'
      );
    }
  } catch (err) {
    showTajToast('Verification Check', err.message || 'Could not verify status.', 'alert-circle');
  }
}

async function handleResendVerificationEmail() {
  try {
    if (!window.TajFirebase) return;
    const sent = await window.TajFirebase.resendEmailVerification();
    if (sent) {
      showTajToast('Link Sent', 'A fresh verification email has been dispatched to your inbox.', 'mail');
    }
  } catch (err) {
    showTajToast('Resend Failed', err.message || 'Could not send verification email.', 'alert-circle');
  }
}

async function handleSignOutFromVerify() {
  closeEmailVerificationGuardModal();
  closeAuthModal();
  await handleLogout();
}

function resumePendingBooking() {
  const intendedStr = sessionStorage.getItem('ask_intended_booking');
  let pending = tajAuth.pendingBooking;
  if (!pending && intendedStr) {
    try { pending = JSON.parse(intendedStr); } catch (e) {}
  }

  if (pending) {
    sessionStorage.removeItem('ask_intended_booking');
    tajAuth.pendingBooking = null;

    showTajToast('Resuming Booking', `Proceeding with reservation for ${pending.roomName}...`, 'check');
    setTimeout(() => {
      openBookingDrawer(pending.roomName, pending.rate);
    }, 350);
  }
}

async function handleLogout() {
  try {
    if (window.TajFirebase) {
      await window.TajFirebase.signOut();
    }
  } catch (e) {}
  tajAuth.logout();
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('user-menu-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

function closeUserDropdown() {
  const dropdown = document.getElementById('user-menu-dropdown');
  if (dropdown) {
    dropdown.classList.add('hidden');
  }
}

/* ================= MY BOOKINGS & USER PROFILE MODALS ================= */
function openMyBookingsModal() {
  const modal = document.getElementById('my-bookings-modal');
  const listElem = document.getElementById('user-bookings-list');
  const emptyElem = document.getElementById('user-bookings-empty');

  const bookings = tajAuth.getBookings();

  if (!bookings || bookings.length === 0) {
    if (listElem) listElem.innerHTML = '';
    if (emptyElem) emptyElem.classList.remove('hidden');
  } else {
    if (emptyElem) emptyElem.classList.add('hidden');
    if (listElem) {
      listElem.innerHTML = bookings.map((b) => {
        const refNo = b.bookingId || b.refNo || 'ASK-RESERVATION';
        const room = b.roomName || b.room || 'Sanctuary Suite';
        const checkIn = b.checkin || b.checkIn || '';
        const checkOut = b.checkout || b.checkOut || '';
        const nights = b.nights || 1;
        const total = b.totalPaid || b.total || 0;
        const paymentId = b.razorpayPaymentId || b.paymentId || 'rzp_verified';

        return `
        <div class="p-4 bg-taj-ivory border-2 border-taj-border hover:border-taj-gold transition-colors text-xs space-y-2">
          <div class="flex items-center justify-between border-b border-taj-border/80 pb-2">
            <div>
              <span class="text-[9px] uppercase tracking-wider font-bold text-taj-muted">Booking Reference</span>
              <div class="font-mono text-taj-gold font-bold text-sm">${refNo}</div>
            </div>
            <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-300">
              ✓ Guaranteed • Cloud Firestore
            </span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <h5 class="font-cinzel font-bold text-sm text-taj-charcoal">${room}</h5>
              <p class="text-[11px] text-taj-muted">${checkIn} — ${checkOut} (${nights} Night${nights > 1 ? 's' : ''})</p>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-taj-muted block">Amount Paid</span>
              <span class="font-cinzel text-base font-bold text-taj-gold">₹${Number(total).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div class="flex items-center justify-between border-t border-taj-border/80 pt-2 text-[10px] text-taj-muted">
            <span>Razorpay: <strong class="font-mono text-taj-charcoal">${paymentId}</strong></span>
            <button onclick="viewBookingVoucher('${refNo}')" class="text-taj-gold hover:underline font-bold uppercase tracking-wider">
              View Voucher →
            </button>
          </div>
        </div>
        `;
      }).join('');
    }
  }

  if (modal) {
    modal.classList.remove('hidden-modal');
    modal.classList.add('show-modal');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeMyBookingsModal() {
  const modal = document.getElementById('my-bookings-modal');
  if (modal) {
    modal.classList.add('hidden-modal');
    modal.classList.remove('show-modal');
  }
}

function viewBookingVoucher(refNo) {
  const bookings = tajAuth.getBookings();
  const b = bookings.find(item => (item.bookingId === refNo || item.refNo === refNo));
  if (!b) return;

  closeMyBookingsModal();

  const confirmModal = document.getElementById('confirmation-modal');
  const bRefNo = b.bookingId || b.refNo || 'ASK-RESERVATION';
  const bPaymentId = b.razorpayPaymentId || b.paymentId || 'rzp_verified';
  const bGuest = b.guestName || (tajAuth.currentUser ? tajAuth.currentUser.name : 'Guest');
  const bEmail = b.guestEmail || (tajAuth.currentUser ? tajAuth.currentUser.email : '');
  const bPhone = b.guestPhone || '+91 98765 43210';
  const bRoom = b.roomName || b.room || 'Sanctuary Suite';
  const bCheckIn = b.checkin || b.checkIn || '';
  const bCheckOut = b.checkout || b.checkOut || '';
  const bNights = b.nights || 1;
  const bBase = b.baseAmount || b.base || 0;
  const bTax = b.gstAmount || b.tax || 0;
  const bTotal = b.totalPaid || b.total || 0;

  document.getElementById('receipt-ref-no').textContent = bRefNo;
  document.getElementById('receipt-payment-id').textContent = bPaymentId;
  document.getElementById('receipt-guest').textContent = bGuest;
  document.getElementById('receipt-contact').textContent = `${bEmail} • ${bPhone}`;
  document.getElementById('receipt-room').textContent = bRoom;
  document.getElementById('receipt-dates').textContent = `${bCheckIn} — ${bCheckOut} (${bNights} Night${bNights > 1 ? 's' : ''})`;
  document.getElementById('receipt-base').textContent = `₹${Number(bBase).toLocaleString('en-IN')}`;
  document.getElementById('receipt-tax-label').textContent = b.taxLabel || 'GST Tax:';
  document.getElementById('receipt-tax').textContent = `₹${Number(bTax).toLocaleString('en-IN')}`;
  document.getElementById('receipt-total').textContent = `₹${Number(bTotal).toLocaleString('en-IN')}`;

  if (confirmModal) {
    confirmModal.classList.remove('hidden-modal');
    confirmModal.classList.add('show-modal');
  }
}

function openUserProfileModal() {
  const modal = document.getElementById('profile-modal');
  const user = tajAuth.getUser() || { name: 'Vansh Yadav', email: 'vansh@arogyadham.in', phone: '+91 98765 43210' };
  const initials = tajAuth.getInitials(user.name);
  const bookings = tajAuth.getBookings();

  const photoEl = document.getElementById('profile-modal-photo');
  const initialsEl = document.getElementById('profile-modal-initials');
  const name = document.getElementById('profile-modal-name');
  const email = document.getElementById('profile-modal-email');
  const phone = document.getElementById('profile-modal-phone');
  const badge = document.getElementById('profile-modal-badge');
  const bookingsCount = document.getElementById('profile-modal-total-bookings');

  if (user.photoURL && photoEl) {
    photoEl.src = user.photoURL;
    photoEl.classList.remove('hidden');
    if (initialsEl) initialsEl.classList.add('hidden');
  } else {
    if (photoEl) photoEl.classList.add('hidden');
    if (initialsEl) {
      initialsEl.textContent = initials;
      initialsEl.classList.remove('hidden');
    }
  }

  if (name) name.textContent = user.name || 'Member';
  if (email) email.textContent = user.email || 'guest@arogyadham.in';
  if (phone) phone.textContent = user.phone || 'Firebase Auth Account';
  if (badge) {
    if (user.emailVerified) {
      badge.textContent = '✓ Verified Member';
      badge.className = 'inline-block mt-0.5 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold border border-emerald-300';
    } else {
      badge.textContent = '⚠️ Email Unverified';
      badge.className = 'inline-block mt-0.5 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 font-bold border border-amber-300';
    }
  }
  if (bookingsCount) bookingsCount.textContent = bookings.length;

  if (modal) {
    modal.classList.remove('hidden-modal');
    modal.classList.add('show-modal');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeUserProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.classList.add('hidden-modal');
    modal.classList.remove('show-modal');
  }
}

function showSavedKutirsModal() {
  const modal = document.getElementById('saved-kutirs-modal');
  if (modal) {
    modal.classList.remove('hidden-modal');
    modal.classList.add('show-modal');
  }
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeSavedKutirsModal() {
  const modal = document.getElementById('saved-kutirs-modal');
  if (modal) {
    modal.classList.add('hidden-modal');
    modal.classList.remove('show-modal');
  }
}

/* ================= TAJ NAVBAR SCROLL EFFECT ================= */
function initTajNavbarScroll() {
  const nav = document.getElementById('taj-nav');
  const brandTitle = document.querySelector('.nav-brand-title');
  const brandSub = document.querySelector('.nav-brand-sub');
  const navLinks = document.querySelectorAll('.nav-link');
  const phoneBtn = document.querySelector('.nav-phone-btn');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-nav-menu');

  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  function handleScroll() {
    if (window.scrollY > 40) {
      if (nav) {
        nav.classList.add('taj-header-scrolled');
        nav.classList.remove('taj-header-gradient');
      }
      if (brandTitle) brandTitle.classList.replace('text-white', 'text-taj-charcoal');
      if (brandSub) brandSub.classList.replace('text-taj-gold-light', 'text-taj-gold');
      if (phoneBtn) phoneBtn.classList.replace('text-white/90', 'text-taj-charcoal');
      if (mobileBtn) mobileBtn.classList.replace('text-white', 'text-taj-charcoal');
      navLinks.forEach(link => {
        link.classList.replace('text-white/90', 'text-taj-charcoal');
        link.classList.add('text-taj-charcoal');
      });
    } else {
      if (nav) {
        nav.classList.remove('taj-header-scrolled');
        nav.classList.add('taj-header-gradient');
      }
      if (brandTitle) brandTitle.classList.replace('text-taj-charcoal', 'text-white');
      if (brandSub) brandSub.classList.replace('text-taj-gold', 'text-taj-gold-light');
      if (phoneBtn) phoneBtn.classList.replace('text-taj-charcoal', 'text-white/90');
      if (mobileBtn) mobileBtn.classList.replace('text-taj-charcoal', 'text-white');
      navLinks.forEach(link => {
        link.classList.remove('text-taj-charcoal');
        link.classList.add('text-white/90');
      });
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ================= VIEW ROUTING & NAVIGATION ARCHITECTURE ================= */
function initRouting() {
  window.addEventListener('hashchange', handleRouting);
  // Handle on page load (e.g. bookmarks or direct URLs)
  handleRouting();
}

function handleRouting() {
  const hash = window.location.hash.toLowerCase();
  const homeView = document.getElementById('home-view');
  const vaidehiView = document.getElementById('vaidehi-view');
  const panchvatiView = document.getElementById('panchvati-view');
  const menuView = document.getElementById('menu-view');
  const pasoeeView = document.getElementById('panchvati-rasoee-view') || document.getElementById('panchvati-pasoee-view');
  const mobileMenu = document.getElementById('mobile-nav-menu');

  if (mobileMenu) {
    mobileMenu.classList.add('hidden');
  }

  if (!homeView || !vaidehiView || !panchvatiView || !menuView) return;

  if (hash === '#vaidehi-rooms' || hash === '#vaidehi' || hash === '#/vaidehi') {
    // 2. DEDICATED SEPARATE PAGE FOR VAIDEHI
    homeView.classList.add('hidden');
    panchvatiView.classList.add('hidden');
    menuView.classList.add('hidden');
    if (pasoeeView) pasoeeView.classList.add('hidden');
    vaidehiView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = "Vaidehi Collection | Arogyadham Swasthya Kutir, Chitrakoot";
  } else if (hash === '#panchvati-rooms' || hash === '#panchvati' || hash === '#/panchvati' || hash === '#panchwati-rooms' || hash === '#panchwati' || hash === '#/panchwati') {
    // 3. DEDICATED SEPARATE PAGE FOR PANCHVATI ROOMS
    homeView.classList.add('hidden');
    vaidehiView.classList.add('hidden');
    menuView.classList.add('hidden');
    if (pasoeeView) pasoeeView.classList.add('hidden');
    panchvatiView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = "Panchvati Collection | Arogyadham Swasthya Kutir, Chitrakoot";
  } else if (hash === '#aahar-vihar-menu' || hash === '#menu' || hash === '#/menu' || hash === '#dining-menu' || hash === '#aahar-vihar') {
    // 4. DEDICATED SEPARATE FULL-PAGE AAHAR-VIHAR MENU VIEW
    homeView.classList.add('hidden');
    vaidehiView.classList.add('hidden');
    panchvatiView.classList.add('hidden');
    if (pasoeeView) pasoeeView.classList.add('hidden');
    menuView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = "Aahar-Vihar Restaurant Menu | Arogyadham Swasthya Kutir, Chitrakoot";
    if (typeof renderDiningDishes === 'function') {
      renderDiningDishes();
      updateDiningBillUI();
    }
  } else if (
    hash === '#panchvati-rasoee-menu' || hash === '#panchvati-rasoee' || hash === '#rasoee-menu' || hash === '#/panchvati-rasoee' || hash === '#rasoee' ||
    hash === '#panchvati-pasoee-menu' || hash === '#panchvati-pasoee' || hash === '#pasoee-menu' || hash === '#/panchvati-pasoee' || hash === '#pasoee'
  ) {
    // 5. DEDICATED SEPARATE FULL-PAGE PANCHVATI RASOEE MENU VIEW
    homeView.classList.add('hidden');
    vaidehiView.classList.add('hidden');
    panchvatiView.classList.add('hidden');
    menuView.classList.add('hidden');
    if (pasoeeView) pasoeeView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = "Panchvati Rasoee Menu | Arogyadham Swasthya Kutir, Chitrakoot";
    if (typeof renderPasoeeItems === 'function') {
      renderPasoeeItems();
      updatePasoeeCartUI();
    }
  } else {
    // 1. HOMEPAGE VIEW (ONLY 4 PRIMARY PILLARS & RESORT HIGHLIGHTS)
    vaidehiView.classList.add('hidden');
    panchvatiView.classList.add('hidden');
    menuView.classList.add('hidden');
    if (pasoeeView) pasoeeView.classList.add('hidden');
    homeView.classList.remove('hidden');
    document.title = "Arogyadham Swasthya Kutir, Chitrakoot | Luxury Wellness Resort";

    if (hash === '#rooms-pillars') {
      setTimeout(() => {
        const el = document.getElementById('rooms-pillars');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else if (hash === '#dining') {
      setTimeout(() => {
        const el = document.getElementById('dining');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else if (hash && hash !== '#home' && hash !== '#' && hash !== '#hero') {
      setTimeout(() => {
        const target = document.querySelector(hash);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function navigateToVaidehi() {
  window.location.hash = '#vaidehi-rooms';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToPanchvati() {
  window.location.hash = '#panchvati-rooms';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
const navigateToPanchwati = navigateToPanchvati;

function navigateToMenu() {
  window.location.hash = '#aahar-vihar-menu';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToPanchvatiRasoeeMenu() {
  window.location.hash = '#panchvati-rasoee-menu';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
const navigateToPanchvatiPasoeeMenu = navigateToPanchvatiRasoeeMenu;
const navigateToRasoeeMenu = navigateToPanchvatiRasoeeMenu;
const navigateToPasoeeMenu = navigateToPanchvatiRasoeeMenu;

function navigateToHomeDining() {
  const homeView = document.getElementById('home-view');
  const vaidehiView = document.getElementById('vaidehi-view');
  const panchvatiView = document.getElementById('panchvati-view');
  const menuView = document.getElementById('menu-view');
  const pasoeeView = document.getElementById('panchvati-rasoee-view') || document.getElementById('panchvati-pasoee-view');

  if (homeView) homeView.classList.remove('hidden');
  if (vaidehiView) vaidehiView.classList.add('hidden');
  if (panchvatiView) panchvatiView.classList.add('hidden');
  if (menuView) menuView.classList.add('hidden');
  if (pasoeeView) pasoeeView.classList.add('hidden');

  window.location.hash = '#dining';
  setTimeout(() => {
    const el = document.getElementById('dining');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 50);
}

function navigateToHomeRooms() {
  const homeView = document.getElementById('home-view');
  const vaidehiView = document.getElementById('vaidehi-view');
  const panchvatiView = document.getElementById('panchvati-view');
  const menuView = document.getElementById('menu-view');
  const pasoeeView = document.getElementById('panchvati-rasoee-view') || document.getElementById('panchvati-pasoee-view');
  if (homeView) homeView.classList.remove('hidden');
  if (vaidehiView) vaidehiView.classList.add('hidden');
  if (panchvatiView) panchvatiView.classList.add('hidden');
  if (menuView) menuView.classList.add('hidden');
  if (pasoeeView) pasoeeView.classList.add('hidden');

  window.location.hash = '#rooms-pillars';
  setTimeout(() => {
    const el = document.getElementById('rooms-pillars');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 50);
}

function navigateToHomeView() {
  const homeView = document.getElementById('home-view');
  const vaidehiView = document.getElementById('vaidehi-view');
  const panchvatiView = document.getElementById('panchvati-view');
  const menuView = document.getElementById('menu-view');
  const pasoeeView = document.getElementById('panchvati-rasoee-view') || document.getElementById('panchvati-pasoee-view');
  if (homeView) homeView.classList.remove('hidden');
  if (vaidehiView) vaidehiView.classList.add('hidden');
  if (panchvatiView) panchvatiView.classList.add('hidden');
  if (menuView) menuView.classList.add('hidden');
  if (pasoeeView) pasoeeView.classList.add('hidden');

  window.location.hash = '#hero';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToSection(sectionId) {
  const homeView = document.getElementById('home-view');
  const vaidehiView = document.getElementById('vaidehi-view');
  const panchvatiView = document.getElementById('panchvati-view');
  const menuView = document.getElementById('menu-view');
  if (homeView) homeView.classList.remove('hidden');
  if (vaidehiView) vaidehiView.classList.add('hidden');
  if (panchvatiView) panchvatiView.classList.add('hidden');
  if (menuView) menuView.classList.add('hidden');

  window.location.hash = `#${sectionId}`;
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 50);
}

/* ================= FLOATING SEARCH HANDLER ================= */
function initSearchInput() {
  const searchInput = document.getElementById('floating-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        triggerQuickSearch();
      }
    });
  }
}

function triggerQuickSearch() {
  const input = document.getElementById('floating-search-input');
  const query = (input ? input.value : '').trim().toLowerCase();

  if (query.includes('mandakini')) {
    openBookingDrawer('Mandakini Royal Suite', 12000);
  } else if (query.includes('paishwani')) {
    openBookingDrawer('Paishwani Heritage Suite', 10000);
  } else if (query.includes('vaidehi')) {
    navigateToVaidehi();
  } else if (query.includes('panchvati') || query.includes('panchwati') || query.includes('rashoyi') || query.includes('thali')) {
    navigateToPanchvati();
  } else if (query.includes('dining') || query.includes('food') || query.includes('menu') || query.includes('aahar')) {
    navigateToSection('dining');
  } else if (query.includes('hospital') || query.includes('boating') || query.includes('cow') || query.includes('gow')) {
    navigateToSection('wellness-facilities');
  } else {
    // Default open drawer
    openBookingDrawer('Mandakini Royal Suite', 12000);
  }
}

/* ================= TAJ RESERVATION DRAWER & CALCULATION ================= */
function openBookingDrawer(roomName = 'Mandakini Royal Suite', rate = 12000) {
  // 1. MANDATORY AUTHENTICATION & EMAIL VERIFICATION GUARD ON BOOKINGS
  const firebaseUser = (window.TajFirebase && window.TajFirebase.auth) ? window.TajFirebase.auth.currentUser : null;
  const currentUser = firebaseUser || tajAuth.currentUser;
  const isAuth = !!currentUser;
  const isVerified = !!(firebaseUser ? firebaseUser.emailVerified : (currentUser && currentUser.emailVerified));

  if (!isAuth) {
    sessionStorage.setItem('ask_intended_booking', JSON.stringify({ roomName, rate }));
    tajAuth.pendingBooking = { roomName, rate };
    openAuthModal('signin', `Please login or signup with Google/Email to proceed with your booking for "${roomName}".`);
    return;
  }

  if (!isVerified) {
    sessionStorage.setItem('ask_intended_booking', JSON.stringify({ roomName, rate }));
    tajAuth.pendingBooking = { roomName, rate };
    openEmailVerificationGuardModal(currentUser ? currentUser.email : '');
    return;
  }

  // Clear intended booking once guard passed
  sessionStorage.removeItem('ask_intended_booking');
  tajAuth.pendingBooking = null;

  tajState.selectedRoom = roomName;
  tajState.selectedRate = rate;

  const drawer = document.getElementById('booking-drawer');
  const kutirNameElem = document.getElementById('drawer-kutir-name');
  const kutirRateElem = document.getElementById('drawer-kutir-rate');
  const selectElem = document.getElementById('drawer-room-select');

  // Auto-fill real verified user details into reservation checkout form
  const user = currentUser;
  if (user) {
    const nameInput = document.getElementById('drawer-guest-name');
    const phoneInput = document.getElementById('drawer-guest-phone');
    const emailInput = document.getElementById('drawer-guest-email');
    if (nameInput) nameInput.value = user.displayName || user.name || '';
    if (phoneInput && user.phone) phoneInput.value = user.phone;
    if (emailInput && user.email) emailInput.value = user.email;

    const drawerBadge = document.getElementById('drawer-user-badge');
    const drawerBadgeName = document.getElementById('drawer-user-badge-name');
    const drawerBadgeEmail = document.getElementById('drawer-user-badge-email');
    if (drawerBadge) drawerBadge.classList.remove('hidden');
    if (drawerBadgeName) drawerBadgeName.textContent = user.displayName || user.name || 'Member';
    if (drawerBadgeEmail) drawerBadgeEmail.textContent = user.email || '';
  }

  // Sync select dropdown intelligently
  if (selectElem) {
    let matchedIndex = -1;
    // 1. Exact match on data-name
    for (let i = 0; i < selectElem.options.length; i++) {
      const optName = selectElem.options[i].getAttribute('data-name');
      if (optName && roomName && optName.trim().toLowerCase() === roomName.trim().toLowerCase()) {
        matchedIndex = i;
        break;
      }
    }
    // 2. Partial match on data-name
    if (matchedIndex === -1 && roomName) {
      for (let i = 0; i < selectElem.options.length; i++) {
        const optName = selectElem.options[i].getAttribute('data-name');
        if (optName && (optName.toLowerCase().includes(roomName.toLowerCase()) || roomName.toLowerCase().includes(optName.toLowerCase()))) {
          matchedIndex = i;
          break;
        }
      }
    }
    // 3. Rate match
    if (matchedIndex === -1 && rate) {
      for (let i = 0; i < selectElem.options.length; i++) {
        if (parseInt(selectElem.options[i].value, 10) === rate) {
          matchedIndex = i;
          break;
        }
      }
    }

    if (matchedIndex !== -1) {
      selectElem.selectedIndex = matchedIndex;
      const matchedOpt = selectElem.options[matchedIndex];
      const optName = matchedOpt.getAttribute('data-name');
      const optRate = parseInt(matchedOpt.value, 10);
      if (optName) tajState.selectedRoom = optName;
      if (optRate) tajState.selectedRate = optRate;
    }
  }

  if (kutirNameElem) kutirNameElem.textContent = tajState.selectedRoom;
  if (kutirRateElem) kutirRateElem.textContent = `₹${tajState.selectedRate.toLocaleString('en-IN')}`;

  calculateTotals();

  if (drawer) {
    drawer.classList.remove('hidden-modal');
    drawer.classList.add('show-modal');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeBookingDrawer() {
  const drawer = document.getElementById('booking-drawer');
  if (drawer) {
    drawer.classList.add('hidden-modal');
    drawer.classList.remove('show-modal');
  }
}

function closeConfirmationModal() {
  const modal = document.getElementById('confirmation-modal');
  if (modal) {
    modal.classList.add('hidden-modal');
    modal.classList.remove('show-modal');
  }
}

function openMenuModal() {
  const modal = document.getElementById('menu-modal');
  if (modal) {
    modal.classList.remove('hidden-modal');
    modal.classList.add('show-modal');
  }
  lucide.createIcons();
}

function closeMenuModal() {
  const modal = document.getElementById('menu-modal');
  if (modal) {
    modal.classList.add('hidden-modal');
    modal.classList.remove('show-modal');
  }
}

function showFacilityModal(title, body) {
  const modal = document.getElementById('facility-modal');
  const titleElem = document.getElementById('facility-modal-title');
  const bodyElem = document.getElementById('facility-modal-body');

  if (titleElem) titleElem.textContent = title;
  if (bodyElem) bodyElem.textContent = body;

  if (modal) {
    modal.classList.remove('hidden-modal');
    modal.classList.add('show-modal');
  }
  lucide.createIcons();
}

function closeFacilityModal() {
  const modal = document.getElementById('facility-modal');
  if (modal) {
    modal.classList.add('hidden-modal');
    modal.classList.remove('show-modal');
  }
}

function initReservationDrawer() {
  const form = document.getElementById('drawer-reservation-form');
  const selectElem = document.getElementById('drawer-room-select');
  const checkinInput = document.getElementById('drawer-checkin');
  const checkoutInput = document.getElementById('drawer-checkout');
  const promoInput = document.getElementById('drawer-promo-code');
  const promoBtn = document.getElementById('drawer-apply-promo');
  const promoMsg = document.getElementById('drawer-promo-msg');
  const confirmModal = document.getElementById('confirmation-modal');

  // Room select change
  if (selectElem) {
    selectElem.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const rate = parseInt(selectedOption.value, 10);
      const name = selectedOption.getAttribute('data-name');

      tajState.selectedRate = rate;
      tajState.selectedRoom = name;

      const kutirNameElem = document.getElementById('drawer-kutir-name');
      const kutirRateElem = document.getElementById('drawer-kutir-rate');

      if (kutirNameElem) kutirNameElem.textContent = name;
      if (kutirRateElem) kutirRateElem.textContent = `₹${rate.toLocaleString('en-IN')}`;

      calculateTotals();
    });
  }

  // Date updates
  function updateDates() {
    if (checkinInput && checkoutInput) {
      const inDate = new Date(checkinInput.value);
      const outDate = new Date(checkoutInput.value);

      if (outDate <= inDate) {
        const nextDay = new Date(inDate);
        nextDay.setDate(nextDay.getDate() + 1);
        checkoutInput.value = nextDay.toISOString().split('T')[0];
      }

      tajState.checkIn = checkinInput.value;
      tajState.checkOut = checkoutInput.value;

      const diff = Math.abs(new Date(checkoutInput.value) - new Date(checkinInput.value));
      tajState.nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

      const nightsDisplay = document.getElementById('drawer-nights-display');
      if (nightsDisplay) {
        nightsDisplay.textContent = `${tajState.checkIn} — ${tajState.checkOut} (${tajState.nights} Night${tajState.nights > 1 ? 's' : ''}) • 2 Guests`;
      }

      calculateTotals();
    }
  }

  if (checkinInput) checkinInput.addEventListener('change', updateDates);
  if (checkoutInput) checkoutInput.addEventListener('change', updateDates);

  // Promo code
  if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'TAJWELLNESS' || code === 'CHITRAKOOT10') {
        tajState.discountPercent = 10;
        tajState.promoCode = code;
        if (promoMsg) {
          promoMsg.textContent = '✓ Taj Heritage Promotion Applied: 10% Discount Subtracted';
          promoMsg.classList.remove('hidden', 'text-red-600');
          promoMsg.classList.add('text-emerald-700');
        }
        showTajToast('Promotion Applied', '10% Royal Heritage discount applied to your stay.', 'check');
      } else if (code === '') {
        tajState.discountPercent = 0;
        if (promoMsg) promoMsg.classList.add('hidden');
      } else {
        if (promoMsg) {
          promoMsg.textContent = '✕ Invalid promo code. Try "TAJWELLNESS"';
          promoMsg.classList.remove('hidden', 'text-emerald-700');
          promoMsg.classList.add('text-red-600');
        }
      }
      calculateTotals();
    });
  }

  // Submit reservation form with Real Razorpay Order & Payment Gateway
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firebaseUser = (window.TajFirebase && window.TajFirebase.auth) ? window.TajFirebase.auth.currentUser : null;
      const currentUser = firebaseUser || tajAuth.currentUser;

      if (!currentUser) {
        openAuthModal('signin', 'Please sign in or create an account to confirm your sanctuary reservation.');
        return;
      }

      if (!currentUser.emailVerified) {
        openEmailVerificationGuardModal(currentUser.email);
        return;
      }

      const guestName = document.getElementById('drawer-guest-name').value.trim();
      const guestPhone = document.getElementById('drawer-guest-phone').value.trim();
      const guestEmail = document.getElementById('drawer-guest-email').value.trim();
      const refNo = `ASK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const isDining = /table|meal|aahar|rasoee|pasoee|thali|dish|coupon/i.test(tajState.selectedRoom);
      const calculatedNights = isDining ? 1 : Math.max(1, tajState.nights || 1);

      const payBtn = document.getElementById('drawer-pay-btn');
      const payBtnLabel = document.getElementById('drawer-pay-btn-label');
      const originalLabel = payBtnLabel ? payBtnLabel.textContent : 'Pay & Confirm';

      if (payBtn) payBtn.disabled = true;
      if (payBtnLabel) payBtnLabel.textContent = 'Generating Razorpay Order...';

      try {
        // 1. CALL REAL BACKEND ORDER API: POST /api/create-razorpay-order
        const orderResponse = await fetch('/api/create-razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: tajState.selectedRoom,
            nights: calculatedNights,
            rate: tajState.selectedRate,
            promoCode: tajState.promoCode,
            guestName: guestName,
            guestEmail: guestEmail,
            guestPhone: guestPhone,
            orderType: isDining ? 'dining' : 'room',
          }),
        });

        if (!orderResponse.ok) {
          const errData = await orderResponse.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${orderResponse.status}`);
        }

        const orderData = await orderResponse.json();
        if (!orderData.success) {
          throw new Error(orderData.error || 'Failed to create Razorpay order');
        }

        console.log('✓ Real Razorpay Order received from backend:', orderData.orderId, 'Amount:', orderData.amount);

        const bookingDetails = {
          refNo: refNo,
          userId: currentUser.uid || 'guest',
          guestName: guestName,
          guestPhone: guestPhone,
          guestEmail: guestEmail,
          room: tajState.selectedRoom,
          checkIn: tajState.checkIn,
          checkOut: tajState.checkOut,
          nights: calculatedNights,
          base: orderData.breakdown ? orderData.breakdown.taxableAmount : tajState.calculatedBase,
          tax: orderData.breakdown ? orderData.breakdown.gstAmount : tajState.calculatedTax,
          taxLabel: tajState.calculatedTaxLabel || (isDining ? '5% GST' : '12% GST'),
          total: orderData.breakdown ? orderData.breakdown.total : Math.round(orderData.amount / 100),
          dateBooked: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        // 2. INITIALIZE REAL RAZORPAY CHECKOUT
        const rzpOptions = {
          key: orderData.keyId || (window.TajFirebase ? window.TajFirebase.razorpayKeyId : 'rzp_test_YOUR_KEY_HERE'),
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Arogyadham Swasthya Kutir",
          description: `${tajState.selectedRoom} (${bookingDetails.nights} Night${bookingDetails.nights > 1 ? 's' : ''})`,
          image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80",
          order_id: orderData.orderId,
          prefill: {
            name: guestName,
            email: guestEmail,
            contact: guestPhone
          },
          notes: {
            booking_ref: refNo,
            sanctuary: "Arogyadham Chitrakoot",
            check_in: tajState.checkIn,
            check_out: tajState.checkOut
          },
          theme: {
            color: "#b98944" // Taj Gold
          },
          handler: async function (paymentResponse) {
            try {
              showTajToast('Verifying Payment', 'Validating Razorpay HMAC SHA256 signature...', 'loader');

              // 3. REAL BACKEND SIGNATURE VERIFICATION: POST /api/verify-payment
              const verifyResponse = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                  bookingDetails: bookingDetails
                })
              });

              const verifyData = await verifyResponse.json();
              if (!verifyData.success) {
                throw new Error(verifyData.error || 'Payment signature verification failed');
              }

              bookingDetails.paymentId = paymentResponse.razorpay_payment_id;
              bookingDetails.orderId = paymentResponse.razorpay_order_id;
              bookingDetails.userId = currentUser.uid || 'guest';

              // 4. REAL DATABASE STORAGE: SAVE TO CLOUD FIRESTORE
              if (window.TajFirebase) {
                await window.TajFirebase.saveBooking(bookingDetails);

                if (isDining) {
                  await window.TajFirebase.saveFoodOrder({
                    orderId: refNo,
                    userId: bookingDetails.userId,
                    items: [{ name: tajState.selectedRoom, rate: tajState.selectedRate }],
                    subtotal: bookingDetails.base,
                    gst: bookingDetails.tax,
                    total: bookingDetails.total,
                    paymentId: paymentResponse.razorpay_payment_id
                  });
                }
              }

              handleRazorpaySuccess(paymentResponse, bookingDetails);
            } catch (verifyErr) {
              console.error('Payment verification error:', verifyErr);
              showTajToast('Verification Failed', verifyErr.message || 'Signature mismatch.', 'alert-triangle');
            }
          },
          modal: {
            ondismiss: function () {
              showTajToast(
                'Payment Dismissed',
                'Transaction cancelled. Your selected room and dates remain preserved.',
                'alert-circle'
              );
            }
          }
        };

        if (typeof window.Razorpay === 'function') {
          const rzpInstance = new window.Razorpay(rzpOptions);
          rzpInstance.on('payment.failed', function (resp) {
            showTajToast('Payment Failed', resp.error ? resp.error.description : 'Payment error.', 'alert-triangle');
          });
          rzpInstance.open();
        } else {
          showTajToast('Razorpay SDK', 'Razorpay Checkout script is loading. Please retry.', 'alert-circle');
        }

      } catch (err) {
        console.error('Reservation order error:', err);
        showTajToast('Order Creation Error', err.message || 'Could not initiate Razorpay order.', 'alert-circle');
      } finally {
        if (payBtn) payBtn.disabled = false;
        if (payBtnLabel) payBtnLabel.textContent = originalLabel;
      }
    });
  }
}

/* ================= BILL BREAKDOWN & DYNAMIC GST CALCULATION ================= */
function calculateTotals() {
  const nights = tajState.nights || 1;
  const isDining = /table|meal|aahar|rasoee|pasoee|thali|dish|coupon/i.test(tajState.selectedRoom);

  // For dining experiences, base is the single event cost; for Kutirs, base is rate * nights
  const baseSubtotal = isDining ? tajState.selectedRate : (tajState.selectedRate * nights);
  let discount = 0;

  if (tajState.discountPercent > 0) {
    discount = Math.round((baseSubtotal * tajState.discountPercent) / 100);
  }

  const taxable = baseSubtotal - discount;
  const taxPercent = isDining ? 5 : 12; // 5% GST for Dining, 12% GST for Kutirs
  const tax = Math.round(taxable * (taxPercent / 100));
  const total = taxable + tax;

  tajState.calculatedBase = taxable;
  tajState.calculatedTax = tax;
  tajState.calculatedTaxPercent = taxPercent;
  tajState.calculatedTaxLabel = isDining ? 'GST (5% Satvik Dining Tax):' : 'GST (12% Hospitality Tax):';
  tajState.calculatedTotal = total;

  const nightsCountElem = document.getElementById('calc-nights-count');
  const baseElem = document.getElementById('drawer-calc-base');
  const discountRow = document.getElementById('drawer-discount-row');
  const discountElem = document.getElementById('drawer-calc-discount');
  const taxLabelElem = document.getElementById('drawer-calc-tax-label');
  const taxElem = document.getElementById('drawer-calc-tax');
  const totalElem = document.getElementById('drawer-calc-total');
  const payBtnLabel = document.getElementById('drawer-pay-btn-label');

  if (nightsCountElem) nightsCountElem.textContent = isDining ? '1 Event' : `${nights}`;
  if (baseElem) baseElem.textContent = `₹${baseSubtotal.toLocaleString('en-IN')}`;

  if (discountRow && discountElem) {
    if (discount > 0) {
      discountRow.classList.remove('hidden');
      discountElem.textContent = `-₹${discount.toLocaleString('en-IN')}`;
    } else {
      discountRow.classList.add('hidden');
    }
  }

  if (taxLabelElem) {
    taxLabelElem.textContent = tajState.calculatedTaxLabel;
  }
  if (taxElem) taxElem.textContent = `₹${tax.toLocaleString('en-IN')}`;
  if (totalElem) totalElem.textContent = `₹${total.toLocaleString('en-IN')}`;

  if (payBtnLabel) {
    payBtnLabel.textContent = `Pay & Confirm Booking with Razorpay (₹${total.toLocaleString('en-IN')})`;
  }
}

function handleRazorpaySuccess(response, bookingDetails) {
  closeBookingDrawer();

  // 1. Save to persistent bookings in localStorage via tajAuth
  tajAuth.addBooking(bookingDetails);

  // 2. Populate and display Luxury Booking Confirmation Voucher
  const confirmModal = document.getElementById('confirmation-modal');
  const refNoElem = document.getElementById('receipt-ref-no');
  const payIdElem = document.getElementById('receipt-payment-id');
  const guestElem = document.getElementById('receipt-guest');
  const contactElem = document.getElementById('receipt-contact');
  const roomElem = document.getElementById('receipt-room');
  const datesElem = document.getElementById('receipt-dates');
  const baseElem = document.getElementById('receipt-base');
  const taxLabelElem = document.getElementById('receipt-tax-label');
  const taxElem = document.getElementById('receipt-tax');
  const totalElem = document.getElementById('receipt-total');

  if (refNoElem) refNoElem.textContent = bookingDetails.refNo;
  if (payIdElem) payIdElem.textContent = bookingDetails.paymentId;
  if (guestElem) guestElem.textContent = bookingDetails.guestName;
  if (contactElem) contactElem.textContent = `${bookingDetails.guestEmail} • ${bookingDetails.guestPhone}`;
  if (roomElem) roomElem.textContent = bookingDetails.room;
  if (datesElem) datesElem.textContent = `${bookingDetails.checkIn} — ${bookingDetails.checkOut} (${bookingDetails.nights} Night${bookingDetails.nights > 1 ? 's' : ''})`;
  if (baseElem) baseElem.textContent = `₹${bookingDetails.base.toLocaleString('en-IN')}`;
  if (taxLabelElem) taxLabelElem.textContent = bookingDetails.taxLabel || 'GST:';
  if (taxElem) taxElem.textContent = `₹${bookingDetails.tax.toLocaleString('en-IN')}`;
  if (totalElem) totalElem.textContent = `₹${bookingDetails.total.toLocaleString('en-IN')}`;

  if (confirmModal) {
    confirmModal.classList.remove('hidden-modal');
    confirmModal.classList.add('show-modal');
  }

  showTajToast(
    'Payment Confirmed',
    `₹${bookingDetails.total.toLocaleString('en-IN')} paid via Razorpay (${bookingDetails.paymentId}). Stay voucher generated.`,
    'crown'
  );

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* ================= COPY ADDRESS TO CLIPBOARD ================= */
function initCopyAddress() {
  const copyBtn = document.getElementById('copy-address-btn');
  const copyLabel = document.getElementById('copy-btn-label');
  const addressText = 'Arogya Dham Rd, Parisar, Majhgawan, Chitrakoot, Madhya Pradesh 485334';

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(addressText).then(() => {
        if (copyLabel) copyLabel.textContent = 'Address Copied!';
        showTajToast('Address Copied', addressText, 'map-pin');
        setTimeout(() => {
          if (copyLabel) copyLabel.textContent = 'Copy Address';
        }, 3000);
      });
    });
  }
}

/* ================= TAJ TOAST NOTIFICATION ================= */
function showTajToast(title, message, iconName = 'sparkles') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'taj-toast p-4 flex items-start gap-3 shadow-xl';
  toast.innerHTML = `
    <div class="w-8 h-8 bg-taj-gold/15 flex items-center justify-center text-taj-gold flex-shrink-0 mt-0.5">
      <i data-lucide="${iconName}" class="w-4 h-4"></i>
    </div>
    <div class="flex-1">
      <h4 class="font-cinzel text-xs font-bold text-taj-charcoal tracking-wider uppercase">${title}</h4>
      <p class="text-xs text-taj-muted mt-0.5 leading-snug">${message}</p>
    </div>
    <button class="text-taj-muted hover:text-taj-charcoal p-1" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.add('toast-active');
  });

  setTimeout(() => {
    toast.classList.remove('toast-active');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

/* ==========================================================================
   AAHAR-VIHAR AUTHENTIC RESTAURANT MENU & 5% GST BILL ENGINE
   ========================================================================== */

const aaharViharMenu = [
  // ================= TAB 1: BREAKFAST =================
  // Indian Breakfast
  { id: 'b-1', name: 'Puri Bhaji (4 pcs)', category: 'breakfast', subcat: 'Indian Breakfast', price: 165, desc: 'Fluffy whole wheat puris served with authentic spiced potato curry and pickle.' },
  { id: 'b-2', name: 'Plain Paratha', category: 'breakfast', subcat: 'Indian Breakfast', price: 55, desc: 'Layered whole wheat paratha roasted golden on traditional tawa.' },
  { id: 'b-3', name: 'Paneer Paratha', category: 'breakfast', subcat: 'Indian Breakfast', price: 89, desc: 'Stuffed with spiced fresh cottage cheese and aromatic herbs, served with curd.' },
  { id: 'b-4', name: 'Aloo Paratha', category: 'breakfast', subcat: 'Indian Breakfast', price: 75, desc: 'Classic spiced mashed potato stuffing with roasted cumin and coriander.' },
  { id: 'b-5', name: 'Mix Veg Pakora (8 pcs)', category: 'breakfast', subcat: 'Indian Breakfast', price: 165, desc: 'Crispy golden fritters of farm-fresh seasonal vegetables in gram flour batter.' },
  { id: 'b-6', name: 'Paneer Pakora (8 pcs)', category: 'breakfast', subcat: 'Indian Breakfast', price: 185, desc: 'Tender fresh cottage cheese fritters dusted with chaat masala and mint chutney.' },

  // South Indian
  { id: 'b-7', name: 'Idli Sambar', category: 'breakfast', subcat: 'South Indian', price: 165, desc: 'Steamed fluffy rice & lentil cakes served with drumstick sambar and fresh coconut chutney.' },
  { id: 'b-8', name: 'Vada Sambar', category: 'breakfast', subcat: 'South Indian', price: 165, desc: 'Crisp golden medu vadas served steeped in piping hot aromatic lentil sambar.' },
  { id: 'b-9', name: 'Uttapam', category: 'breakfast', subcat: 'South Indian', price: 145, desc: 'Thick fermented rice pancake topped with fresh tomatoes, onions and green chillies.' },
  { id: 'b-10', name: 'Plain Dosa', category: 'breakfast', subcat: 'South Indian', price: 165, desc: 'Crispy golden crepe served with coconut chutney, tomato chutney, and hot sambar.' },
  { id: 'b-11', name: 'Masala Dosa', category: 'breakfast', subcat: 'South Indian', price: 185, desc: 'Crispy crepe filled with traditional tempered potato mash and mustard seeds.' },
  { id: 'b-12', name: 'Cheese Dosa', category: 'breakfast', subcat: 'South Indian', price: 209, desc: 'Artisanal golden crisp dosa loaded with melted cheddar and fresh herbs.' },
  { id: 'b-13', name: 'Veg Upma', category: 'breakfast', subcat: 'South Indian', price: 165, desc: 'Roasted semolina tempered with mustard seeds, curry leaves, and crunchy cashews.' },
  { id: 'b-14', name: 'Indori Poha', category: 'breakfast', subcat: 'South Indian', price: 109, desc: 'Steamed flattened rice tempered with fennel seeds, turmeric, roasted peanuts, and Sev.' },

  // Continental & Sandwiches
  { id: 'b-15', name: 'Veg Cutlet', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 165, desc: 'Golden crumbed vegetable patties served with house dip.' },
  { id: 'b-16', name: 'French Fries', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 145, desc: 'Crisp salted golden potato fries served with dip.' },
  { id: 'b-17', name: 'Bread Ghee Jam', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 89, desc: 'Toasted farmhouse bread with pure A2 cow ghee and fruit preserves.' },
  { id: 'b-18', name: 'Oats', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 165, desc: 'Warm wholesome rolled oats simmered in milk with dry fruits and honey.' },
  { id: 'b-19', name: 'Choco Flakes', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 109, desc: 'Served with chilled or warm fresh milk.' },
  { id: 'b-20', name: 'Corn Flakes', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 109, desc: 'Crispy toasted corn cereal served with farm milk.' },
  { id: 'b-21', name: 'Fruit Platter', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 199, desc: 'Chef’s selection of fresh seasonal cut fruits and berries.' },
  { id: 'b-22', name: 'Veg Sandwich', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 145, desc: 'Fresh cucumber, tomato, mint chutney and cheese slices in soft bread.' },
  { id: 'b-23', name: 'Veg Grilled Sandwich', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 165, desc: 'Crisp pressed sandwich with cheese, crunchy bell peppers, and herbs.' },
  { id: 'b-24', name: 'Veg Club Sandwich', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 189, desc: 'Triple-decker toasted sandwich loaded with vegetables, cheese, and house coleslaw.' },
  { id: 'b-25', name: 'Cheese Chilly Toast', category: 'breakfast', subcat: 'Continental & Sandwiches', price: 145, desc: 'Golden toast topped with molten cheese, green chillies, and oregano.' },

  // ================= TAB 2: STARTERS & SOUPS =================
  // Indian Kebabs
  { id: 's-1', name: 'Hara Bhara Kebab', category: 'starters-soups', subcat: 'Indian Kebabs', price: 219, desc: 'Spinach, green pea and cottage cheese patties shallow fried with aromatic spices.' },
  { id: 's-2', name: 'Dahi Ke Kebab', category: 'starters-soups', subcat: 'Indian Kebabs', price: 275, desc: 'Silken hung curd kebabs with a delicately spiced crisp golden exterior.' },
  { id: 's-3', name: 'Paneer Tikka / Peshawari / Malai', category: 'starters-soups', subcat: 'Indian Kebabs', price: 275, desc: 'Charcoal-grilled cottage cheese cubes marinated in your choice of Peshawari spices or rich Malai cream.' },
  { id: 's-4', name: 'Corn Cheese Kebab', category: 'starters-soups', subcat: 'Indian Kebabs', price: 219, desc: 'Sweet corn and mozzarella skewers lightly spiced and griddle roasted.' },
  { id: 's-5', name: 'Tandoori Mushroom', category: 'starters-soups', subcat: 'Indian Kebabs', price: 275, desc: 'Fresh button mushrooms marinated in spiced hung curd and clay oven roasted.' },

  // Chinese Starters
  { id: 's-6', name: 'Chilli Mushroom', category: 'starters-soups', subcat: 'Chinese Starters', price: 275, desc: 'Wok-tossed button mushrooms with bell peppers, spring onion, and soy sauce.' },
  { id: 's-7', name: 'Veg Manchurian (Dry)', category: 'starters-soups', subcat: 'Chinese Starters', price: 249, desc: 'Crisp vegetable dumplings tossed in tangy Manchurian glaze with coriander.' },
  { id: 's-8', name: 'Chilli Paneer (Dry)', category: 'starters-soups', subcat: 'Chinese Starters', price: 285, desc: 'Cottage cheese cubes tossed in spicy chilli garlic sauce with crunchy capsicum.' },
  { id: 's-9', name: 'Crispy Corn', category: 'starters-soups', subcat: 'Chinese Starters', price: 219, desc: 'Golden fried sweet corn kernels tossed with black pepper, spring onion, and lime.' },
  { id: 's-10', name: 'Veg Spring Roll', category: 'starters-soups', subcat: 'Chinese Starters', price: 275, desc: 'Crispy roll stuffed with sautéed julienne vegetables, served with sweet chilli dip.' },
  { id: 's-11', name: 'Honey Chilli Potato', category: 'starters-soups', subcat: 'Chinese Starters', price: 249, desc: 'Crispy potato fingers glazed in honey, chilli, and toasted sesame seeds.' },
  { id: 's-12', name: 'Chinese Sizzler', category: 'starters-soups', subcat: 'Chinese Starters', price: 439, desc: 'Smoking hot platter with noodles, fried rice, veg manchurian, French fries and grilled veggies.' },

  // Soups
  { id: 'sp-1', name: 'Cream of Tomato Soup', category: 'starters-soups', subcat: 'Soups', price: 165, desc: 'Rich ripe tomato reduction infused with fresh basil, butter, and crunchy croutons.' },
  { id: 'sp-2', name: 'Hot & Sour Soup', category: 'starters-soups', subcat: 'Soups', price: 165, desc: 'Spicy tangy oriental vegetable broth with shredded bamboo and mushrooms.' },
  { id: 'sp-3', name: 'Veg Manchow Soup', category: 'starters-soups', subcat: 'Soups', price: 165, desc: 'Classic dark soya garlic soup garnished with crispy fried noodles.' },
  { id: 'sp-4', name: 'Sweet Corn Soup', category: 'starters-soups', subcat: 'Soups', price: 165, desc: 'Velvety cream soup of sweet American corn and finely chopped vegetables.' },
  { id: 'sp-5', name: 'Cream of Spinach Soup', category: 'starters-soups', subcat: 'Soups', price: 165, desc: 'Fresh farm spinach simmered with nutmeg and fresh cream.' },
  { id: 'sp-6', name: 'Clear Veg Soup', category: 'starters-soups', subcat: 'Soups', price: 165, desc: 'Nourishing light herbal broth with garden veggies and aromatic peppercorns.' },
  { id: 'sp-7', name: 'Lemon Coriander Soup', category: 'starters-soups', subcat: 'Soups', price: 165, desc: 'Zesty lemon and fresh coriander broth with vitamin-rich garden vegetables.' },
  { id: 'sp-8', name: 'Mix Millet Soup', category: 'starters-soups', subcat: 'Soups', price: 189, desc: 'Signature Arogyadham wellness soup prepared with toasted barnyard millets and fresh herbs.' },

  // Pizzas & Pastas
  { id: 'pz-1', name: 'Paneer Tikka Pizza', category: 'starters-soups', subcat: 'Pizzas & Pastas', price: 265, desc: 'Stone-baked pizza topped with spiced paneer tikka, bell peppers, and mozzarella.' },
  { id: 'pz-2', name: 'Margherita Pizza', category: 'starters-soups', subcat: 'Pizzas & Pastas', price: 219, desc: 'Classic San Marzano tomato sauce, fresh basil leaves, and molten mozzarella.' },
  { id: 'pz-3', name: 'Corn Veg Pizza', category: 'starters-soups', subcat: 'Pizzas & Pastas', price: 239, desc: 'Golden sweet corn, crisp onions, capsicum, olives, and mozzarella.' },
  { id: 'pz-4', name: 'Pasta Alfredo / Pink Sauce', category: 'starters-soups', subcat: 'Pizzas & Pastas', price: 165, desc: 'Penne pasta tossed in rich parmesan cream sauce or zesty pink tomato-herb sauce.' },
  { id: 'pz-5', name: 'Cheese Chilly Balls', category: 'starters-soups', subcat: 'Pizzas & Pastas', price: 319, desc: 'Crisp breaded golden spheres bursting with molten jalapeño cheese.' },
  { id: 'pz-6', name: 'Sauteed Veg', category: 'starters-soups', subcat: 'Pizzas & Pastas', price: 275, desc: 'Farm-fresh broccoli, zucchini, bell peppers and baby corn tossed in olive oil & herbs.' },

  // ================= TAB 3: MAIN COURSE =================
  // Millet Specials
  { id: 'm-1', name: 'Mix Millet Khichdi', category: 'mains', subcat: 'Millet Specials', price: 385, desc: 'Superfood blend of Kodo, Foxtail & Barnyard millets slow-cooked with yellow moong and A2 cow ghee.' },
  { id: 'm-2', name: 'Makai Palak Ki Subzi', category: 'mains', subcat: 'Millet Specials', price: 385, desc: 'Sweet corn kernels simmered in a rich velvety spinach gravy with roasted garlic and cumin.' },
  { id: 'm-3', name: 'Millet Daliya', category: 'mains', subcat: 'Millet Specials', price: 385, desc: 'Traditional broken pearl millet cooked with farm vegetables and light digestives.' },
  { id: 'm-4', name: 'Black Fried Rice', category: 'mains', subcat: 'Millet Specials', price: 385, desc: 'Antioxidant-rich organic black rice wok-tossed with garden vegetables.' },

  // Indian Gravies
  { id: 'im-1', name: 'Paneer Butter Masala', category: 'mains', subcat: 'Indian Gravies', price: 329, desc: 'Cottage cheese simmered in rich creamy tomato and butter gravy with fenugreek.' },
  { id: 'im-2', name: 'Kadai Paneer', category: 'mains', subcat: 'Indian Gravies', price: 329, desc: 'Paneer and bell peppers cooked in freshly crushed coriander and red chilli masala.' },
  { id: 'im-3', name: 'Palak Paneer', category: 'mains', subcat: 'Indian Gravies', price: 329, desc: 'Tender cottage cheese cooked in creamy fresh spinach purée with aromatic spices.' },
  { id: 'im-4', name: 'Matar Paneer', category: 'mains', subcat: 'Indian Gravies', price: 329, desc: 'Traditional homestyle combination of green peas and paneer in spiced onion gravy.' },
  { id: 'im-5', name: 'Paneer Lababdar', category: 'mains', subcat: 'Indian Gravies', price: 329, desc: 'Rich luscious cashew-tomato gravy garnished with grated paneer and cream.' },
  { id: 'im-6', name: 'Paneer Bhurji', category: 'mains', subcat: 'Indian Gravies', price: 329, desc: 'Crumbled cottage cheese sautéed with onions, ripe tomatoes, green chillies and fresh herbs.' },
  { id: 'im-7', name: 'Veg Kofta', category: 'mains', subcat: 'Indian Gravies', price: 275, desc: 'Melt-in-mouth vegetable and paneer dumplings in a mild golden cardamom gravy.' },
  { id: 'im-8', name: 'Tomato Palak Bhurji', category: 'mains', subcat: 'Indian Gravies', price: 219, desc: 'Light rustic preparation of fresh farm spinach and juicy ripe tomatoes.' },
  { id: 'im-9', name: 'Hing Dhaniya Aloo', category: 'mains', subcat: 'Indian Gravies', price: 219, desc: 'Baby potatoes tempered with asafetida (hing), roasted coriander seeds and cumin.' },
  { id: 'im-10', name: 'Methi Matar Malai', category: 'mains', subcat: 'Indian Gravies', price: 275, desc: 'Fresh fenugreek leaves and sweet green peas in a smooth sweet cream reduction.' },
  { id: 'im-11', name: 'Bhindi Masala', category: 'mains', subcat: 'Indian Gravies', price: 279, desc: 'Crisp ladyfingers pan-roasted with onions, amchur and roasted cumin.' },
  { id: 'im-12', name: 'Baingan Bharta', category: 'mains', subcat: 'Indian Gravies', price: 219, desc: 'Smoked roasted aubergine mashed with tomatoes, green chillies, and mustard oil.' },
  { id: 'im-13', name: 'Lauki Home Style', category: 'mains', subcat: 'Indian Gravies', price: 219, desc: 'Wholesome digestive bottle gourd cooked in light cumin and turmeric broth.' },
  { id: 'im-14', name: 'Karela Sabji', category: 'mains', subcat: 'Indian Gravies', price: 219, desc: 'Ayurvedic bitter gourd caramelized with jaggery, fennel seeds, and mango powder.' },
  { id: 'im-15', name: 'Veg Kolhapuri', category: 'mains', subcat: 'Indian Gravies', price: 275, desc: 'Spicy mixed vegetables cooked in robust Kolhapuri red chilli and coconut paste.' },
  { id: 'im-16', name: 'Mix Veg', category: 'mains', subcat: 'Indian Gravies', price: 275, desc: 'Assorted seasonal vegetables sautéed with traditional north Indian spices.' },
  { id: 'im-17', name: 'Soya Keema Matar', category: 'mains', subcat: 'Indian Gravies', price: 249, desc: 'Protein-packed minced soya granules and green peas in spiced bhuna gravy.' },
  { id: 'im-18', name: 'Sev Tomato', category: 'mains', subcat: 'Indian Gravies', price: 219, desc: 'Zesty Kathiyawadi sweet-and-sour tomato curry topped with crisp gram flour sev.' },
  { id: 'im-19', name: 'Yellow Dal Tadka', category: 'mains', subcat: 'Indian Gravies', price: 219, desc: 'Yellow lentils tempered with A2 cow ghee, cumin, dry red chillies, and garlic.' },
  { id: 'im-20', name: 'Dal Makhani', category: 'mains', subcat: 'Indian Gravies', price: 229, desc: 'Black lentils slow-cooked overnight over tandoor embers with butter and cream.' },

  // Chinese Mains
  { id: 'cm-1', name: 'Veg Manchurian Gravy', category: 'mains', subcat: 'Chinese Mains', price: 249, desc: 'Crispy veg dumplings served in hearty savory garlic-coriander gravy.' },
  { id: 'cm-2', name: 'Chilli Paneer Gravy', category: 'mains', subcat: 'Chinese Mains', price: 275, desc: 'Paneer cubes in zesty oriental chilli gravy with bell peppers and spring onion.' },
  { id: 'cm-3', name: 'Hakka Noodles', category: 'mains', subcat: 'Chinese Mains', price: 219, desc: 'Wok-tossed noodles with shredded cabbage, carrots, bell peppers and mild seasoning.' },
  { id: 'cm-4', name: 'Schezwan Noodles', category: 'mains', subcat: 'Chinese Mains', price: 249, desc: 'Fiery wok-tossed noodles with house Schezwan pepper sauce.' },
  { id: 'cm-5', name: 'Veg Fried Rice', category: 'mains', subcat: 'Chinese Mains', price: 219, desc: 'Long grain rice tossed with finely diced vegetables and light soy.' },
  { id: 'cm-6', name: 'Schezwan Rice', category: 'mains', subcat: 'Chinese Mains', price: 249, desc: 'Aromatic spicy fried rice with red chillies, garlic, and fresh vegetables.' },
  { id: 'cm-7', name: 'Veg Noodle Special', category: 'mains', subcat: 'Chinese Mains', price: 275, desc: 'Special chef noodles loaded with pan-seared vegetables and sesame.' },
  { id: 'cm-8', name: 'Triple Schezwan Noodle & Rice', category: 'mains', subcat: 'Chinese Mains', price: 385, desc: 'Combination of fried rice, noodles, crispy noodles and hot Schezwan gravy.' },

  // Breads
  { id: 'br-1', name: 'Bajra / Makka / Jowar Roti (Plain ₹55 / Ghee ₹60)', category: 'mains', subcat: 'Breads', price: 55, desc: 'Traditional gluten-free millet flatbreads cooked over open flame.' },
  { id: 'br-2', name: 'Lachha Paratha', category: 'mains', subcat: 'Breads', price: 55, desc: 'Multi-layered crispy whole wheat tandoori flatbread with butter.' },
  { id: 'br-3', name: 'Tawa Chapati (Plain ₹35 / Ghee ₹45)', category: 'mains', subcat: 'Breads', price: 35, desc: 'Soft whole wheat phulka made fresh on tawa.' },
  { id: 'br-4', name: 'Missi Roti', category: 'mains', subcat: 'Breads', price: 45, desc: 'Spiced gram flour and wheat flatbread with carom seeds and onions.' },
  { id: 'br-5', name: 'Naan (Plain ₹70 / Butter ₹75)', category: 'mains', subcat: 'Breads', price: 70, desc: 'Classic clay oven baked refined flour bread.' },
  { id: 'br-6', name: 'Tandoori Roti (Plain ₹30 / Butter ₹40)', category: 'mains', subcat: 'Breads', price: 30, desc: 'Crisp whole wheat bread baked in clay tandoor.' },
  { id: 'br-7', name: 'Stuffed Kulcha (Paneer / Aloo ₹99 / ₹119)', category: 'mains', subcat: 'Breads', price: 99, desc: 'Amritsari style kulcha stuffed with spiced fillings.' },
  { id: 'br-8', name: 'Bread Basket (Assorted 5 Pcs)', category: 'mains', subcat: 'Breads', price: 195, desc: 'Chef’s selection: Butter Naan, Laccha Paratha, Missi Roti & Tandoori Roti.' },

  // Rice & Biryani
  { id: 'rc-1', name: 'Subz Dum Biryani', category: 'mains', subcat: 'Rice & Biryani', price: 385, desc: 'Fragrant basmati rice layered with garden vegetables, saffron and spices, cooked on dum in sealed handi.' },
  { id: 'rc-2', name: 'Paneer Tikka Biryani', category: 'mains', subcat: 'Rice & Biryani', price: 499, desc: 'Smoked tandoori paneer tikka slow-cooked with basmati rice, mint, and saffron.' },
  { id: 'rc-3', name: 'Jeera Rice', category: 'mains', subcat: 'Rice & Biryani', price: 219, desc: 'Steamed basmati rice tempered with cumin seeds and whole ghee.' },
  { id: 'rc-4', name: 'Veg Pulao', category: 'mains', subcat: 'Rice & Biryani', price: 329, desc: 'Aromatic basmati rice cooked with fresh seasonal vegetables and whole garam masala.' },
  { id: 'rc-5', name: 'Steamed Rice', category: 'mains', subcat: 'Rice & Biryani', price: 165, desc: 'Fluffy long grain basmati rice.' },
  { id: 'rc-6', name: 'Dal Khichdi', category: 'mains', subcat: 'Rice & Biryani', price: 329, desc: 'Comforting home-style moong dal and rice tempered with ghee and cumin.' },

  // Raita & Salads
  { id: 'rs-1', name: 'Mix Veg Raita', category: 'mains', subcat: 'Raita & Salads', price: 129, desc: 'Chilled curd with cucumber, tomato, onion and roasted cumin.' },
  { id: 'rs-2', name: 'Boondi Raita', category: 'mains', subcat: 'Raita & Salads', price: 109, desc: 'Crispy gram flour puffs soaked in seasoned spiced yoghurt.' },
  { id: 'rs-3', name: 'Pineapple Raita', category: 'mains', subcat: 'Raita & Salads', price: 155, desc: 'Sweet diced pineapple in chilled creamy sweetened yoghurt.' },
  { id: 'rs-4', name: 'Mixed Fruit Raita', category: 'mains', subcat: 'Raita & Salads', price: 165, desc: 'Assorted seasonal diced fruits in spiced chilled curd.' },
  { id: 'rs-5', name: 'Masala Papad', category: 'mains', subcat: 'Raita & Salads', price: 55, desc: 'Roasted or fried lentil papad topped with spicy onion-tomato-coriander mix.' },
  { id: 'rs-6', name: 'Plain Papad', category: 'mains', subcat: 'Raita & Salads', price: 35, desc: 'Crispy roasted or fried poppadom.' },
  { id: 'rs-7', name: 'Green Salad', category: 'mains', subcat: 'Raita & Salads', price: 119, desc: 'Fresh slices of cucumber, tomato, carrot, radish, and green chillies with lemon.' },
  { id: 'rs-8', name: 'Russian Salad', category: 'mains', subcat: 'Raita & Salads', price: 179, desc: 'Diced boiled vegetables and pineapple in creamy dressing.' },
  { id: 'rs-9', name: 'Kachumber Salad', category: 'mains', subcat: 'Raita & Salads', price: 119, desc: 'Finely chopped onion, tomato, cucumber tossed with lemon juice and chaat masala.' },

  // ================= TAB 4: DESSERTS & BEVERAGES =================
  // Desserts
  { id: 'd-1', name: 'Sawa Ki Kheer', category: 'desserts-beverages', subcat: 'Desserts', price: 165, desc: 'Barnyard millet slow-simmered in thick sweetened milk with saffron and almonds.' },
  { id: 'd-2', name: 'Sewaiyan Kheer', category: 'desserts-beverages', subcat: 'Desserts', price: 165, desc: 'Roasted vermicelli pudding flavored with green cardamom and dry fruits.' },
  { id: 'd-3', name: 'Gulab Jamun (2 pcs)', category: 'desserts-beverages', subcat: 'Desserts', price: 79, desc: 'Warm golden milk dumplings steeped in rose and cardamom sugar syrup.' },
  { id: 'd-4', name: 'Moong Dal Halwa', category: 'desserts-beverages', subcat: 'Desserts', price: 165, desc: 'Rich golden yellow lentil pudding slow-roasted in pure cow ghee and garnished with pistachios.' },
  { id: 'd-5', name: 'Gajar Halwa (Seasonal)', category: 'desserts-beverages', subcat: 'Desserts', price: 165, desc: 'Red carrot halwa cooked in full-cream milk, khoya and pure ghee.' },
  { id: 'd-6', name: 'Ice Cream (Scoop)', category: 'desserts-beverages', subcat: 'Desserts', price: 79, desc: 'Choice of Vanilla, Mango, or Kesar Pista.' },

  // Beverages
  { id: 'bv-1', name: 'Fresh Juice (Watermelon / Sweet Lime / Orange)', category: 'desserts-beverages', subcat: 'Beverages', price: 135, desc: '100% freshly pressed cold fruit juice without added sugar.' },
  { id: 'bv-2', name: 'Shakes (Mango / Banana / Chocolate)', category: 'desserts-beverages', subcat: 'Beverages', price: 135, desc: 'Chilled thick milkshakes made with real fruit and premium ingredients.' },
  { id: 'bv-3', name: 'Buttermilk (Chach / Spiced)', category: 'desserts-beverages', subcat: 'Beverages', price: 89, desc: 'Digestive probiotic drink blended with roasted cumin, rock salt, and mint.' },
  { id: 'bv-4', name: 'Lassi (Sweet / Salted)', category: 'desserts-beverages', subcat: 'Beverages', price: 109, desc: 'Thick churned creamy yoghurt drink served in clay kulhad.' },
  { id: 'bv-5', name: 'Cold Coffee', category: 'desserts-beverages', subcat: 'Beverages', price: 129, desc: 'Rich chilled blended coffee with fresh milk and ice cream.' },
  { id: 'bv-6', name: 'Soda / Coke (Can/Glass ₹65 / ₹85)', category: 'desserts-beverages', subcat: 'Beverages', price: 65, desc: 'Chilled beverage or aerated soda.' },
  { id: 'bv-7', name: 'Mineral Water (1 Litre)', category: 'desserts-beverages', subcat: 'Beverages', price: 45, desc: 'Packaged natural mineral drinking water.' },
  { id: 'bv-8', name: 'Alkaline Water (1 Litre)', category: 'desserts-beverages', subcat: 'Beverages', price: 60, desc: 'Pure pH-balanced energized wellness water.' },

  // Mocktails
  { id: 'bv-9', name: 'Fruit Punch Mocktail', category: 'desserts-beverages', subcat: 'Mocktails', price: 149, desc: 'Layered blend of fresh tropical fruit juices, grenadine, and ice.' },
  { id: 'bv-10', name: 'Virgin Mojito', category: 'desserts-beverages', subcat: 'Mocktails', price: 149, desc: 'Crushed garden mint, fresh lime wedges, sparkling soda, and cane sugar.' },
  { id: 'bv-11', name: 'Fresh Lime Soda (Sweet / Salted)', category: 'desserts-beverages', subcat: 'Mocktails', price: 79, desc: 'Freshly squeezed lemon juice topped with bubbly soda.' },
  { id: 'bv-12', name: 'Fresh Lime Water', category: 'desserts-beverages', subcat: 'Mocktails', price: 65, desc: 'Chilled lemon water with cumin and rock salt.' },

  // Chai & Coffee
  { id: 'bv-13', name: 'Chai (Masala / Black / Gud Tulsi)', category: 'desserts-beverages', subcat: 'Chai & Coffee', price: 65, desc: 'Simmered with ginger, cardamom, holy basil and organic jaggery.' },
  { id: 'bv-14', name: 'Green Tea (Herbal)', category: 'desserts-beverages', subcat: 'Chai & Coffee', price: 75, desc: 'Antioxidant whole leaf green tea with lemon grass.' },
  { id: 'bv-15', name: 'Coffee (Filter / Espresso ₹75 / ₹85)', category: 'desserts-beverages', subcat: 'Chai & Coffee', price: 75, desc: 'Freshly brewed aromatic South Indian filter coffee or espresso.' },
  { id: 'bv-16', name: 'Hot Milk (Organic A2 Cow Milk)', category: 'desserts-beverages', subcat: 'Chai & Coffee', price: 85, desc: 'Pure boiled farm milk with optional turmeric or cardamom.' },
  { id: 'bv-17', name: 'Bournvita / Hot Chocolate', category: 'desserts-beverages', subcat: 'Chai & Coffee', price: 109, desc: 'Warm velvety chocolate health drink with farm milk.' }
];

const diningSubcategories = {
  'breakfast': ['All', 'Indian Breakfast', 'South Indian', 'Continental & Sandwiches'],
  'starters-soups': ['All', 'Indian Kebabs', 'Chinese Starters', 'Soups', 'Pizzas & Pastas'],
  'mains': ['All', 'Indian Gravies', 'Chinese Mains', 'Millet Specials', 'Breads', 'Rice & Biryani', 'Raita & Salads'],
  'desserts-beverages': ['All', 'Desserts', 'Beverages', 'Mocktails', 'Chai & Coffee']
};

const diningMenuState = {
  currentTab: 'breakfast',
  currentSubcat: 'All',
  searchQuery: '',
  cart: {} // { [dishId]: quantity }
};

function initDiningMenu() {
  const container = document.getElementById('dining-dishes-grid');
  if (!container) return;

  renderDiningSubcatChips();
  renderDiningDishes();
  updateDiningBillUI();
}

function switchDiningTab(tabId) {
  diningMenuState.currentTab = tabId;
  diningMenuState.currentSubcat = 'All';

  // Update Tab Buttons UI
  ['breakfast', 'starters-soups', 'mains', 'desserts-beverages'].forEach(tab => {
    const btn = document.getElementById(`tab-btn-${tab}`);
    if (btn) {
      if (tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  renderDiningSubcatChips();
  renderDiningDishes();
}

function renderDiningSubcatChips() {
  const container = document.getElementById('dining-subcat-chips');
  if (!container) return;

  const chips = diningSubcategories[diningMenuState.currentTab] || ['All'];
  container.innerHTML = chips.map(subcat => {
    const isActive = diningMenuState.currentSubcat === subcat;
    return `
      <button type="button" onclick="filterDiningSubcat('${subcat.replace(/'/g, "\\'")}')"
        class="dining-subcat-chip ${isActive ? 'active' : ''}">
        ${subcat}
      </button>
    `;
  }).join('');
}

function filterDiningSubcat(subcat) {
  diningMenuState.currentSubcat = subcat;
  renderDiningSubcatChips();
  renderDiningDishes();
}

function handleDiningSearch(query) {
  diningMenuState.searchQuery = (query || '').trim().toLowerCase();
  const clearBtn = document.getElementById('dining-search-clear');
  if (clearBtn) {
    if (diningMenuState.searchQuery.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
  renderDiningDishes();
}

function clearDiningSearch() {
  const input = document.getElementById('dining-search-input');
  if (input) input.value = '';
  diningMenuState.searchQuery = '';
  const clearBtn = document.getElementById('dining-search-clear');
  if (clearBtn) clearBtn.classList.add('hidden');
  renderDiningDishes();
}

function renderDiningDishes() {
  const grid = document.getElementById('dining-dishes-grid');
  const emptyState = document.getElementById('dining-empty-state');
  const countLabel = document.getElementById('dining-dishes-count-label');
  if (!grid) return;

  const query = diningMenuState.searchQuery;

  // Filter items
  const filtered = aaharViharMenu.filter(item => {
    // If searching, check match across name, subcat, desc
    const matchesSearch = !query || 
      item.name.toLowerCase().includes(query) ||
      item.subcat.toLowerCase().includes(query) ||
      item.desc.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // If there is an active search query, allow results from across all categories or active tab
    if (query) {
      // Prioritize active tab if no subcat specified, or show all if search is broad
      return true;
    }

    // Standard category & subcategory filtering
    if (item.category !== diningMenuState.currentTab) return false;
    if (diningMenuState.currentSubcat !== 'All' && item.subcat !== diningMenuState.currentSubcat) return false;

    return true;
  });

  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} authentic dishes (Taxes: +5% GST)`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  grid.innerHTML = filtered.map(item => {
    const qty = diningMenuState.cart[item.id] || 0;
    const basePrice = item.price;
    const gstAmount = +(basePrice * 0.05).toFixed(2);
    const totalPrice = +(basePrice + gstAmount).toFixed(2);

    return `
      <div class="menu-dish-card p-4 sm:p-5 flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="veg-symbol" title="100% Satvik Pure Veg"></span>
              <span class="text-[10px] uppercase font-bold tracking-wider text-taj-gold">${item.subcat}</span>
            </div>
            <span class="text-[10px] text-taj-muted bg-taj-ivory px-2 py-0.5 border border-taj-border">+5% GST</span>
          </div>

          <h4 class="font-cinzel text-sm sm:text-base font-bold text-taj-charcoal group-hover:text-taj-gold transition-colors leading-snug">
            ${item.name}
          </h4>

          <p class="text-xs text-taj-body mt-1 leading-relaxed line-clamp-2">
            ${item.desc}
          </p>
        </div>

        <div class="pt-4 mt-3 border-t border-taj-border/80 flex items-center justify-between">
          <div>
            <div class="flex items-baseline gap-1">
              <span class="font-cinzel text-base font-bold text-taj-charcoal">₹${basePrice}</span>
              <span class="text-[10px] text-taj-muted font-normal">+ 5% GST</span>
            </div>
            <span class="text-[10px] text-taj-gold block font-medium">
              = ₹${totalPrice} incl. tax
            </span>
          </div>

          <div>
            ${qty > 0 ? `
              <div class="flex items-center gap-1.5 border border-taj-gold bg-taj-ivory p-0.5">
                <button type="button" onclick="changeDiningQty('${item.id}', -1)" class="qty-btn" title="Decrease">−</button>
                <span class="w-6 text-center text-xs font-bold text-taj-charcoal">${qty}</span>
                <button type="button" onclick="changeDiningQty('${item.id}', 1)" class="qty-btn" title="Increase">+</button>
              </div>
            ` : `
              <button type="button" onclick="addToDiningCart('${item.id}')"
                class="btn-taj-primary py-1.5 px-3.5 text-[11px] font-semibold tracking-wider">
                + Add
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function addToDiningCart(dishId) {
  const item = aaharViharMenu.find(i => i.id === dishId);
  if (!item) return;

  diningMenuState.cart[dishId] = (diningMenuState.cart[dishId] || 0) + 1;
  renderDiningDishes();
  updateDiningBillUI();
  showTajToast('Added to Dining Tray', `${item.name} • ₹${item.price} (+5% GST)`, 'utensils');
}

function changeDiningQty(dishId, delta) {
  const current = diningMenuState.cart[dishId] || 0;
  const updated = current + delta;

  if (updated <= 0) {
    delete diningMenuState.cart[dishId];
  } else {
    diningMenuState.cart[dishId] = updated;
  }

  renderDiningDishes();
  updateDiningBillUI();
}

function clearDiningCart() {
  diningMenuState.cart = {};
  renderDiningDishes();
  updateDiningBillUI();
  showTajToast('Tray Cleared', 'All dishes removed from your dining estimate.', 'trash-2');
}

function calculateDiningBill() {
  let subtotal = 0;
  let itemsCount = 0;
  const items = [];

  Object.entries(diningMenuState.cart).forEach(([id, qty]) => {
    const dish = aaharViharMenu.find(i => i.id === id);
    if (dish && qty > 0) {
      const lineSubtotal = dish.price * qty;
      subtotal += lineSubtotal;
      itemsCount += qty;
      items.push({
        ...dish,
        qty,
        lineSubtotal
      });
    }
  });

  const cgst = +(subtotal * 0.025).toFixed(2);
  const sgst = +(subtotal * 0.025).toFixed(2);
  const totalGst = +(cgst + sgst).toFixed(2);
  const totalPayable = +(subtotal + totalGst).toFixed(2);

  return {
    items,
    itemsCount,
    subtotal: +subtotal.toFixed(2),
    cgst,
    sgst,
    totalGst,
    totalPayable
  };
}

function updateDiningBillUI() {
  const bill = calculateDiningBill();
  const listElem = document.getElementById('dining-bill-items-list');
  const subtotalElem = document.getElementById('dining-bill-subtotal');
  const cgstElem = document.getElementById('dining-bill-cgst');
  const sgstElem = document.getElementById('dining-bill-sgst');
  const gstElem = document.getElementById('dining-bill-gst');
  const totalElem = document.getElementById('dining-bill-total');
  const clearBtn = document.getElementById('dining-clear-tray-btn');

  if (subtotalElem) subtotalElem.textContent = `₹${bill.subtotal.toLocaleString('en-IN')}`;
  if (cgstElem) cgstElem.textContent = `₹${bill.cgst.toLocaleString('en-IN')}`;
  if (sgstElem) sgstElem.textContent = `₹${bill.sgst.toLocaleString('en-IN')}`;
  if (gstElem) gstElem.textContent = `₹${bill.totalGst.toLocaleString('en-IN')}`;
  if (totalElem) totalElem.textContent = `₹${bill.totalPayable.toLocaleString('en-IN')}`;

  if (clearBtn) {
    clearBtn.style.display = bill.itemsCount > 0 ? 'block' : 'none';
  }

  if (listElem) {
    if (bill.items.length === 0) {
      listElem.innerHTML = `
        <div class="text-center py-6 text-taj-muted text-xs">
          <i data-lucide="shopping-bag" class="w-6 h-6 text-taj-gold/50 mx-auto mb-2 stroke-1"></i>
          <p>Your dining tray is empty.</p>
          <p class="text-[11px] text-taj-muted mt-0.5">Click <strong class="text-taj-charcoal font-semibold">+ Add</strong> on any dish to preview your bill with 5% GST.</p>
        </div>
      `;
    } else {
      listElem.innerHTML = bill.items.map(item => `
        <div class="flex items-center justify-between p-2 bg-taj-ivory/70 border border-taj-border/80 text-xs">
          <div class="flex-1 pr-2">
            <h5 class="font-semibold text-taj-charcoal text-xs leading-tight">${item.name}</h5>
            <span class="text-[10px] text-taj-muted">₹${item.price} × ${item.qty}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center border border-taj-border bg-white">
              <button type="button" onclick="changeDiningQty('${item.id}', -1)" class="w-5 h-5 flex items-center justify-center hover:bg-taj-gold hover:text-white text-xs font-bold">−</button>
              <span class="w-5 text-center text-[11px] font-bold">${item.qty}</span>
              <button type="button" onclick="changeDiningQty('${item.id}', 1)" class="w-5 h-5 flex items-center justify-center hover:bg-taj-gold hover:text-white text-xs font-bold">+</button>
            </div>
            <span class="font-bold text-taj-charcoal text-xs min-w-[50px] text-right">₹${item.lineSubtotal}</span>
          </div>
        </div>
      `).join('');
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function reserveTableWithOrder() {
  const bill = calculateDiningBill();
  if (bill.itemsCount === 0) {
    openBookingDrawer('Table Reservation at Aahar-Vihar', 450);
    return;
  }

  const orderTitle = `Table Reservation at Aahar-Vihar (${bill.itemsCount} Dishes)`;
  openBookingDrawer(orderTitle, Math.round(bill.totalPayable));
  showTajToast('Dining Order Pre-Loaded', `${bill.itemsCount} items with 5% GST loaded into booking drawer.`, 'check-circle');
}

function shareOrderOnWhatsApp() {
  const bill = calculateDiningBill();
  if (bill.itemsCount === 0) {
    showTajToast('Tray Empty', 'Please add dishes to calculate your estimate before sending.', 'info');
    return;
  }

  let text = `*AAHAR-VIHAR DINING ESTIMATE*\n*Arogyadham Swasthya Kutir, Chitrakoot*\n\n`;
  text += `*SELECTED DISHES (${bill.itemsCount} Items):*\n`;
  bill.items.forEach(item => {
    text += `• ${item.name} x ${item.qty} = ₹${item.lineSubtotal}\n`;
  });
  text += `\n----------------------------\n`;
  text += `*Items Subtotal:* ₹${bill.subtotal}\n`;
  text += `*CGST (2.5%):* ₹${bill.cgst}\n`;
  text += `*SGST (2.5%):* ₹${bill.sgst}\n`;
  text += `*Total 5% GST:* ₹${bill.totalGst}\n`;
  text += `*TOTAL PAYABLE:* ₹${bill.totalPayable}\n`;
  text += `----------------------------\n`;
  text += `Kindly confirm table availability and dining reservation.`;

  const url = `https://wa.me/917670265334?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/* ================= PANCHVATI RASOEE MENU & COUPON ESTIMATOR ================= */
const PANCHVATI_RASOEE_ITEMS = [
  {
    id: 'pasoee-satvik-thali',
    name: 'Regular Satvik Thali',
    hindi: 'दैनिक सात्विक थाली (दोपहर / रात्रि)',
    desc: 'Seasonal Dal Tadka, 2 Daily Seasonal Sabzi (e.g. Lauki Kofta / Aloo Jeera), 4 Fresh Tava Phulkas with Desi Ghee, Steamed Rice, Fresh Salad, Papad & Vedic Sweet.',
    timing: 'Lunch (12:00 - 14:30) & Dinner (19:30 - 21:30)',
    basePrice: 220,
    gstRate: 0.05,
    tag: 'Community Staple'
  },
  {
    id: 'pasoee-festival-thali',
    name: 'Special Festival / Ayurvedic Thali',
    hindi: 'विशेष आयुर्वेदिक एवं पर्व थाली',
    desc: 'Tridosha-harmonizing royal thali featuring Paneer Pasanda, Seasonal Greens, Dal Panchmel, 2 Millet Rotis + 2 Phulkas, Sawa Rice / Millet Khichdi, Cow Milk Kheer & Digestive Herbal Rasam.',
    timing: 'Lunch & Dinner Special',
    basePrice: 280,
    gstRate: 0.05,
    tag: 'Ayurvedic Feast'
  },
  {
    id: 'pasoee-morning-breakfast',
    name: 'Morning Wholesome Breakfast',
    hindi: 'पौष्टिक प्रभात अल्पाहार',
    desc: 'Nourishing Morning Breakfast with Organic Millet Daliya, Fluffy Indori Poha / Steamed Idli Sambar, Seasonal Fresh Fruit Bowl & Hot Jaggery Tulsi Tea.',
    timing: 'Breakfast (07:30 - 09:30 AM)',
    basePrice: 150,
    gstRate: 0.05,
    tag: 'Daily Pratham Aahar'
  },
  {
    id: 'pasoee-extra-phulka',
    name: 'Extra Phulka / Chapatis Basket (4 Pcs)',
    hindi: 'अतिरिक्त देसी घी फुल्का टोकरी (४ रोटी)',
    desc: 'Basket of 4 hot whole-wheat tawa rotis roasted on traditional cast-iron tawa and brushed with pure A2 Desi Cow Ghee.',
    timing: 'Available All Meals',
    basePrice: 40,
    gstRate: 0.05,
    tag: 'Add-On'
  },
  {
    id: 'pasoee-desi-ghee',
    name: 'Desi Ghee Bowl (50ml)',
    hindi: 'शुद्ध वैदिक गौ-घृत कटोरी',
    desc: 'Freshly clarified A2 Desi Cow Ghee bowl (50ml) prepared from indigenous Gir cows in our Parisar Gow Shala.',
    timing: 'Available All Meals',
    basePrice: 30,
    gstRate: 0.05,
    tag: 'Pure Vedic Ghee'
  },
  {
    id: 'pasoee-herbal-buttermilk',
    name: 'Herbal Buttermilk / Chhach (300ml)',
    hindi: 'मसाला छाछ / पाचक तक्र',
    desc: 'Traditional chilled probiotic buttermilk churned fresh with roasted cumin seeds, Himalayan rock salt, fresh mint, and coriander.',
    timing: 'Breakfast & Lunch',
    basePrice: 40,
    gstRate: 0.05,
    tag: 'Digestive Elixir'
  }
];
const PANCHVATI_PASOEE_ITEMS = PANCHVATI_RASOEE_ITEMS;

let pasoeeCart = {};

function renderPasoeeItems() {
  const container = document.getElementById('pasoee-items-grid') || document.getElementById('rasoee-items-grid');
  if (!container) return;

  container.innerHTML = PANCHVATI_RASOEE_ITEMS.map(item => {
    const qty = pasoeeCart[item.id] || 0;
    const gstAmount = +(item.basePrice * item.gstRate).toFixed(2);
    const totalInclTax = +(item.basePrice + gstAmount).toFixed(2);

    return `
      <div class="taj-white-card p-5 flex flex-col justify-between hover:border-taj-gold transition-all duration-300 group">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2 border-b border-taj-border/60 pb-2.5">
            <div>
              <div class="flex items-center gap-1.5 mb-1">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                <span class="text-[10px] uppercase font-bold tracking-widest text-taj-gold">${item.tag}</span>
              </div>
              <h4 class="font-cinzel text-base font-bold text-taj-charcoal group-hover:text-taj-gold transition-colors">
                ${item.name}
              </h4>
              <span class="text-[11px] text-taj-gold font-medium block">${item.hindi}</span>
            </div>
            <span class="text-[10px] font-semibold px-2 py-0.5 bg-taj-ivory border border-taj-border text-taj-charcoal uppercase tracking-wider flex-shrink-0">
              +5% GST
            </span>
          </div>

          <p class="text-xs text-taj-body leading-relaxed">
            ${item.desc}
          </p>

          <div class="flex items-center gap-1 text-[11px] text-taj-muted pt-1">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-taj-gold flex-shrink-0"></i>
            <span>${item.timing}</span>
          </div>
        </div>

        <div class="pt-4 mt-3 border-t border-taj-border flex items-center justify-between">
          <div>
            <div class="flex items-baseline gap-1">
              <span class="font-cinzel text-lg font-bold text-taj-charcoal">₹${item.basePrice}</span>
              <span class="text-[10px] text-taj-muted">+ 5% GST</span>
            </div>
            <span class="text-[10px] text-taj-gold block font-medium">= ₹${totalInclTax} incl. tax</span>
          </div>

          <div>
            ${qty === 0 ? `
              <button type="button" onclick="addToPasoeeCart('${item.id}')"
                class="btn-taj-primary py-1.5 px-4 text-xs flex items-center gap-1.5">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>Add</span>
              </button>
            ` : `
              <div class="flex items-center border border-taj-gold bg-taj-ivory">
                <button type="button" onclick="changePasoeeQty('${item.id}', -1)"
                  class="w-7 h-7 flex items-center justify-center hover:bg-taj-gold hover:text-white transition-colors text-xs font-bold">−</button>
                <span class="w-8 text-center text-xs font-bold text-taj-charcoal">${qty}</span>
                <button type="button" onclick="changePasoeeQty('${item.id}', 1)"
                  class="w-7 h-7 flex items-center justify-center hover:bg-taj-gold hover:text-white transition-colors text-xs font-bold">+</button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function addToPasoeeCart(id) {
  pasoeeCart[id] = (pasoeeCart[id] || 0) + 1;
  renderPasoeeItems();
  updatePasoeeCartUI();
  const item = PANCHVATI_PASOEE_ITEMS.find(i => i.id === id);
  if (item) {
    showTajToast('Coupon Added', `${item.name} added to coupon tray.`, 'check-circle');
  }
}

function changePasoeeQty(id, delta) {
  if (!pasoeeCart[id]) return;
  pasoeeCart[id] += delta;
  if (pasoeeCart[id] <= 0) {
    delete pasoeeCart[id];
  }
  renderPasoeeItems();
  updatePasoeeCartUI();
}

function clearPasoeeCart() {
  pasoeeCart = {};
  renderPasoeeItems();
  updatePasoeeCartUI();
  showTajToast('Tray Cleared', 'Your coupon estimator has been reset.', 'info');
}

function calculatePasoeeBill() {
  let subtotal = 0;
  let itemsCount = 0;
  const items = [];

  Object.keys(pasoeeCart).forEach(id => {
    const item = PANCHVATI_PASOEE_ITEMS.find(i => i.id === id);
    const qty = pasoeeCart[id];
    if (item && qty > 0) {
      const lineSubtotal = item.basePrice * qty;
      subtotal += lineSubtotal;
      itemsCount += qty;
      items.push({
        id: item.id,
        name: item.name,
        price: item.basePrice,
        qty,
        lineSubtotal
      });
    }
  });

  const cgst = +(subtotal * 0.025).toFixed(2);
  const sgst = +(subtotal * 0.025).toFixed(2);
  const totalGst = +(cgst + sgst).toFixed(2);
  const totalPayable = +(subtotal + totalGst).toFixed(2);

  return { subtotal, cgst, sgst, totalGst, totalPayable, itemsCount, items };
}

function updatePasoeeCartUI() {
  const bill = calculatePasoeeBill();

  const subtotalElem = document.getElementById('pasoee-subtotal');
  const cgstElem = document.getElementById('pasoee-cgst');
  const sgstElem = document.getElementById('pasoee-sgst');
  const gstElem = document.getElementById('pasoee-gst');
  const totalElem = document.getElementById('pasoee-total');
  const listElem = document.getElementById('pasoee-coupon-items-list');
  const clearBtn = document.getElementById('pasoee-clear-btn');

  if (subtotalElem) subtotalElem.textContent = `₹${bill.subtotal.toLocaleString('en-IN')}`;
  if (cgstElem) cgstElem.textContent = `₹${bill.cgst.toLocaleString('en-IN')}`;
  if (sgstElem) sgstElem.textContent = `₹${bill.sgst.toLocaleString('en-IN')}`;
  if (gstElem) gstElem.textContent = `₹${bill.totalGst.toLocaleString('en-IN')}`;
  if (totalElem) totalElem.textContent = `₹${bill.totalPayable.toLocaleString('en-IN')}`;

  if (clearBtn) {
    clearBtn.style.display = bill.itemsCount > 0 ? 'block' : 'none';
  }

  if (listElem) {
    if (bill.items.length === 0) {
      listElem.innerHTML = `
        <div class="p-4 bg-white border border-dashed border-taj-border text-center text-taj-muted">
          <i data-lucide="utensils-crossed" class="w-6 h-6 mx-auto mb-2 text-taj-muted/50"></i>
          <p>No meal coupons added yet.</p>
          <span class="text-[10px] block mt-1">Select a thali or breakfast to calculate live estimate.</span>
        </div>
      `;
    } else {
      listElem.innerHTML = bill.items.map(item => `
        <div class="flex items-center justify-between p-2 bg-taj-ivory/70 border border-taj-border/80 text-xs">
          <div class="flex-1 pr-2">
            <h5 class="font-semibold text-taj-charcoal text-xs leading-tight">${item.name}</h5>
            <span class="text-[10px] text-taj-muted">₹${item.price} × ${item.qty}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center border border-taj-border bg-white">
              <button type="button" onclick="changePasoeeQty('${item.id}', -1)" class="w-5 h-5 flex items-center justify-center hover:bg-taj-gold hover:text-white text-xs font-bold">−</button>
              <span class="w-5 text-center text-[11px] font-bold">${item.qty}</span>
              <button type="button" onclick="changePasoeeQty('${item.id}', 1)" class="w-5 h-5 flex items-center justify-center hover:bg-taj-gold hover:text-white text-xs font-bold">+</button>
            </div>
            <span class="font-bold text-taj-charcoal text-xs min-w-[50px] text-right">₹${item.lineSubtotal}</span>
          </div>
        </div>
      `).join('');
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function reservePasoeeCoupon() {
  const bill = calculatePasoeeBill();
  if (bill.itemsCount === 0) {
    openBookingDrawer('Meal Booking at Panchvati Rasoee', 220);
    return;
  }

  const orderTitle = `Meal Coupons at Panchvati Rasoee (${bill.itemsCount} Items)`;
  openBookingDrawer(orderTitle, Math.round(bill.totalPayable));
  showTajToast('Coupon Pre-Loaded', `${bill.itemsCount} coupons with 5% GST loaded into booking drawer.`, 'check-circle');
}

function sharePasoeeWhatsApp() {
  const bill = calculatePasoeeBill();
  if (bill.itemsCount === 0) {
    showTajToast('Tray Empty', 'Please select thali coupons before sharing on WhatsApp.', 'info');
    return;
  }

  let text = `*PANCHVATI RASOEE MEAL COUPON ESTIMATE*\n*Arogyadham Swasthya Kutir, Chitrakoot*\n\n`;
  text += `*SELECTED MEALS & ADD-ONS (${bill.itemsCount} Items):*\n`;
  bill.items.forEach(item => {
    text += `• ${item.name} x ${item.qty} = ₹${item.lineSubtotal}\n`;
  });
  text += `\n----------------------------\n`;
  text += `*Items Subtotal:* ₹${bill.subtotal}\n`;
  text += `*CGST (2.5%):* ₹${bill.cgst}\n`;
  text += `*SGST (2.5%):* ₹${bill.sgst}\n`;
  text += `*Total 5% GST:* ₹${bill.totalGst}\n`;
  text += `*TOTAL PAYABLE:* ₹${bill.totalPayable}\n`;
  text += `----------------------------\n`;
  text += `Kindly confirm dining coupon reservation for our party.`;

  const url = `https://wa.me/917670265334?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// Aliases for Panchvati Rasoee
const renderRasoeeItems = renderPasoeeItems;
const addToRasoeeCart = addToPasoeeCart;
const changeRasoeeQty = changePasoeeQty;
const clearRasoeeCart = clearPasoeeCart;
const calculateRasoeeBill = calculatePasoeeBill;
const updateRasoeeCartUI = updatePasoeeCartUI;
const reserveRasoeeCoupon = reservePasoeeCoupon;
const shareRasoeeWhatsApp = sharePasoeeWhatsApp;
const rasoeeCart = pasoeeCart;
