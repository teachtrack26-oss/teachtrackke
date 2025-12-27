import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\components\navbar.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ============ FIND MOBILE MENU AUTH SECTION ============
# We want to replace the logged-in part of the mobile menu
# content around line 510-546 in the file we viewed

target_block_start = '{isLoggedIn ? ('
target_block_end = ') : ('

# We'll locate the mobile menu section first to avoid hitting desktop code
mobile_menu_start = 'className="md:hidden bg-[#0F172A]/95 backdrop-blur-xl border-t border-white/10 shadow-xl absolute w-full"'

if mobile_menu_start not in content:
    print("Could not find mobile menu start")
    exit(1)

parts = content.split(mobile_menu_start)
pre_mobile = parts[0] + mobile_menu_start
mobile_part = parts[1]

# Now inside mobile_part, find the LoggedIn section
if target_block_start not in mobile_part:
    print("Could not find logged in block in mobile menu")
    exit(1)

loggedIn_split = mobile_part.split(target_block_start, 1)
pre_loggedIn = loggedIn_split[0]
post_loggedIn_chunk = loggedIn_split[1]

# Find the end of the logged in block
# We know it ends with ') : ('
if target_block_end not in post_loggedIn_chunk:
    print("Could not find end of logged in block")
    exit(1)

post_loggedIn_split = post_loggedIn_chunk.split(target_block_end, 1)
existing_menu_content = post_loggedIn_split[0]
remainder = post_loggedIn_split[1]

# ============ NEW MOBILE MENU CONTENT ============
# Recreate the rich profile experience from desktop for mobile
new_menu_content = """
                <div className="space-y-3">
                  <div className="px-4 mb-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-primary-400">
                        {(user?.name || user?.full_name || user?.email)
                          ?.charAt(0)
                          .toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">
                          {user?.name ||
                            user?.full_name ||
                            user?.email?.split("@")[0] ||
                            "Account"}
                        </div>
                        <div className="text-sm text-slate-400">{user?.email}</div>
                      </div>
                    </div>
                    
                    {/* User Badge - Mobile */}
                    <div className="mt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                          user?.subscription_type === 'SCHOOL_SPONSORED'
                            ? 'bg-blue-100 text-blue-800'
                            : user?.subscription_type === 'INDIVIDUAL_PREMIUM'
                            ? 'bg-amber-100 text-amber-800' // Yellow badge like screenshot
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user?.subscription_type === 'SCHOOL_SPONSORED'
                            ? 'School Plan'
                            : user?.subscription_type === 'INDIVIDUAL_PREMIUM'
                            ? 'Individual Premium'
                            : 'Free Plan'}
                        </span>
                    </div>
                  </div>

                  <div className="px-2 space-y-1">
                      <Link
                        href="/pricing"
                        className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-slate-300 hover:text-primary-600 hover:bg-[#0F172A]/30 rounded-2xl transition-all duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="p-2 bg-white/5 rounded-lg text-slate-400">
                           <FiCreditCard className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                           <span className="block text-white">My Plan</span>
                           <span className="text-xs text-slate-500">Manage subscription</span>
                        </div>
                      </Link>

                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-slate-300 hover:text-primary-600 hover:bg-[#0F172A]/30 rounded-2xl transition-all duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                         <div className="p-2 bg-white/5 rounded-lg text-slate-400">
                           <FiUser className="w-5 h-5" />
                         </div>
                        <span className="text-white">Dashboard</span>
                      </Link>

                      <Link
                        href="/settings/profile"
                        className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-slate-300 hover:text-primary-600 hover:bg-[#0F172A]/30 rounded-2xl transition-all duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                         <div className="p-2 bg-white/5 rounded-lg text-slate-400">
                           <FiSettings className="w-5 h-5" />
                         </div>
                        <span className="text-white">Settings</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-base font-medium text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-200 mt-4 border border-red-500/20"
                      >
                         <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                           <FiLogOut className="w-5 h-5" />
                         </div>
                        <span>Sign Out</span>
                      </button>
                  </div>
                </div>
"""

# Reconstruct file
new_content = pre_mobile + pre_loggedIn + target_block_start + new_menu_content + target_block_end + remainder

if new_content != original:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Mobile menu updated to match profile dropdown!")
else:
    print("No changes needed")
